"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireRole } from "../../src/web/auth/session.js";
import { createBotRegistration, updateBotRegistration } from "../../src/web/admin/bot-management.js";

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
      settingsInput: formData.get("settings"),
    });
    revalidatePath("/admin", "layout");
    return { success: "Bot gespeichert. Der Discord-Adapter übernimmt aktive Bots beim nächsten Polling-Intervall." };
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
