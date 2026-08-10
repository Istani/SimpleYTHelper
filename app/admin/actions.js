"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireRole } from "../../src/web/auth/session.js";
import { createBotRegistration, updateBotRegistration } from "../../src/web/admin/bot-management.js";
import { saveDiscordOAuthApplication } from "../../src/web/admin/discord-oauth-application.js";

let prismaInstance = null;
function getPrisma() {
  if (prismaInstance) return prismaInstance;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Die Datenbankverbindung ist nicht konfiguriert.");
  prismaInstance = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  return prismaInstance;
}

function actionError(error) {
  if (error instanceof TypeError) return error.message;
  if (error?.code === 'P2002') return "Diese Bot-ID ist bereits vergeben.";
  return "Die Änderung konnte nicht gespeichert werden.";
}

export async function createBotAction(_previousState, formData) {
  const session = await requireRole("admin");
  try {
    await createBotRegistration({
      prisma: getPrisma(),
      actorId: session.sub,
      botId: formData.get("botId"),
      token: formData.get("token"),
      accountKind: formData.get("accountKind"),
      settingsInput: formData.get("settings"),
    });
    revalidatePath("/admin", "layout");
    return { success: "Bot gespeichert. Der Discord-Adapter übernimmt aktive Bots beim nächsten Polling-Intervall." };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function saveDiscordOAuthApplicationAction(_previousState, formData) {
  const session = await requireRole("admin");
  try {
    const encryptionKey = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
    if (!encryptionKey) throw new TypeError("Die serverseitige Token-Verschlüsselung ist nicht konfiguriert.");
    const clientSecret = formData.get("clientSecret");
    await saveDiscordOAuthApplication({
      prisma: getPrisma(),
      clientId: formData.get("clientId"),
      clientSecret,
      redirectUri: formData.get("redirectUri"),
      isActive: formData.get("isActive") === "on",
      encryptionKey,
    });
    await getPrisma().oauthProviderConfigurationAudit.create({
      data: { provider: 'discord', actorId: session.sub, details: { clientSecretRotated: Boolean(String(clientSecret || '').trim()), isActive: formData.get("isActive") === "on" } },
    });
    revalidatePath("/admin/discord/oauth");
    revalidatePath("/connections");
    return { success: "Discord Developer-Konfiguration gespeichert. Das Secret wird nie wieder angezeigt." };
  } catch (error) {
    return { error: actionError(error) };
  }
}

export async function updateBotAction(_previousState, formData) {
  const session = await requireRole("admin");
  try {
    await updateBotRegistration({
      prisma: getPrisma(),
      actorId: session.sub,
      botId: formData.get("botId"),
      isActive: formData.get("isActive") === "on",
      token: formData.get("token"),
      settingsInput: formData.get("settings"),
    });
    revalidatePath("/admin", "layout");
    return { success: "Bot-Konfiguration gespeichert. Ein neu gesetzter Token wird nie wieder angezeigt." };
  } catch (error) {
    return { error: actionError(error) };
  }
}
