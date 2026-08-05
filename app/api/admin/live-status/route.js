import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getSession } from "../../../../src/web/auth/session.js";
import { publicBotRegistration } from "../../../../src/web/admin/bot-management.js";
import { mergeBotRuntimeStatus } from "../../../../src/web/admin/live-status.js";

let prismaInstance = null;

function getPrisma() {
  if (prismaInstance) return prismaInstance;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  prismaInstance = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  return prismaInstance;
}

async function fetchAdapterBots() {
  const adapterUrl = process.env.DISCORD_ADAPTER_INTERNAL_URL || process.env.DISCORD_ADAPTER_URL || "http://discord-adapter:3000";
  const internalToken = process.env.INTERNAL_ADAPTER_TOKEN;
  if (!internalToken) throw new Error("INTERNAL_ADAPTER_TOKEN is not configured");

  const response = await fetch(`${adapterUrl}/internal/v1/bots`, {
    headers: { Authorization: `Bearer ${internalToken}` },
    cache: "no-store",
    signal: AbortSignal.timeout(2000),
  });
  if (!response.ok) throw new Error(`adapter status returned ${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload.bots) ? payload.bots : [];
}

export async function GET() {
  const session = await getSession();
  if (!session?.roles?.includes("admin")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const [records, adapterBots] = await Promise.all([
      getPrisma().discordBotRegistration.findMany({ orderBy: { createdAt: "desc" } }),
      fetchAdapterBots(),
    ]);
    const bots = mergeBotRuntimeStatus(records, adapterBots).map((record) => publicBotRegistration(record, record));
    return NextResponse.json({ bots }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ error: "live_status_unavailable" }, { status: 503 });
  }
}
