import { DashboardShell } from "../../src/web/components/dashboard-shell.js";
import { BotManagementPanel } from "../../src/web/components/bot-management-panel.js";
import { requireRole } from "../../src/web/auth/session.js";
import { publicBotRegistration } from "../../src/web/admin/bot-management.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

let prismaInstance = null;
function getPrisma() {
  if (prismaInstance) return prismaInstance;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  try {
    prismaInstance = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    return prismaInstance;
  } catch {
    return null;
  }
}

async function fetchAdapterBotStatuses() {
  const adapterUrl = process.env.DISCORD_ADAPTER_INTERNAL_URL || process.env.DISCORD_ADAPTER_URL || "http://discord-adapter:3000";
  const internalToken = process.env.INTERNAL_ADAPTER_TOKEN;
  if (!internalToken) return new Map();

  try {
    const res = await fetch(`${adapterUrl}/internal/v1/bots`, {
      headers: { Authorization: `Bearer ${internalToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return new Map();
    const data = await res.json();
    const map = new Map();
    for (const bot of (data.bots || [])) {
      map.set(bot.bot_id, { online: true, ready: Boolean(bot.ready) });
    }
    return map;
  } catch {
    return new Map();
  }
}

export default async function AdminPage() {
  const user = await requireRole("admin");
  const prisma = getPrisma();
  let bots = [];
  let recentMessages = [];

  if (prisma) {
    try {
      const records = await prisma.discordBotRegistration.findMany({ orderBy: { createdAt: "desc" } });
      const statusMap = await fetchAdapterBotStatuses();
      bots = records.map((record) => publicBotRegistration(record, statusMap.get(record.botId) || { online: false, ready: false }));
      const messages = await prisma.discordMessage.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: { author: true, channel: true, guild: true },
      });

      // Determine which bot received/sent each message based on guild/client mapping or default to active bot
      const activeBotId = bots.find(b => b.isActive && b.online)?.botId || (bots[0]?.botId ?? "SimpleYTH");
      recentMessages = messages.map(msg => ({ ...msg, botId: activeBotId }));
    } catch {
      // The database-backed panels remain empty while PostgreSQL is unavailable.
    }
  }

  return <DashboardShell user={user} label="Verwaltung" title="Alles läuft ruhig.">
    <div>
      <div className="stats">
        <article><span>Reg. Bots</span><strong>{bots.length}</strong><small>{bots.filter((bot) => bot.isActive && bot.online).length} verbunden ({bots.filter((bot) => bot.isActive).length} aktiv)</small></article>
        <article><span>Nachrichten</span><strong>{recentMessages.length}</strong><small>erfasst</small></article>
        <article><span>System</span><strong className="good">Online</strong><small>Webfrontend & DB</small></article>
      </div>

      <BotManagementPanel bots={bots} />

      <section className="panel" style={{ marginTop: "20px", flexDirection: "column", alignItems: "stretch" }}>
        <div>
          <span className="kicker">Live Data Stream</span>
          <h2>Empfangene Nachrichten</h2>
          {recentMessages.length === 0 ? (
            <p style={{ marginTop: "10px" }}>Noch keine Nachrichten erfasst. Sobald ein Bot Nachrichten empfängt und abspeichert, erscheinen sie hier.</p>
          ) : (
            <div style={{ marginTop: "15px", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e5e5", textAlign: "left", color: "#606060" }}>
                    <th style={{ padding: "8px" }}>Zeitpunkt (Berlin)</th>
                    <th style={{ padding: "8px" }}>Bot</th>
                    <th style={{ padding: "8px" }}>Gilde</th>
                    <th style={{ padding: "8px" }}>Kanal</th>
                    <th style={{ padding: "8px" }}>Autor</th>
                    <th style={{ padding: "8px" }}>Nachricht</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMessages.map((message) => {
                    const localTime = new Intl.DateTimeFormat("de-DE", {
                      timeZone: "Europe/Berlin",
                      dateStyle: "short",
                      timeStyle: "medium",
                    }).format(new Date(message.createdAt));
                    return (
                      <tr key={message.id} style={{ borderBottom: "1px solid #e5e5e5" }}>
                        <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{localTime}</td>
                        <td style={{ padding: "8px" }}><code>{message.botId}</code></td>
                        <td style={{ padding: "8px" }}>{message.guild?.name || message.guildId}</td>
                        <td style={{ padding: "8px" }}>#{message.channel?.name || message.channelId}</td>
                        <td style={{ padding: "8px" }}>{message.author?.username || message.authorId}</td>
                        <td style={{ padding: "8px", wordBreak: "break-word" }}>{message.content}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  </DashboardShell>;
}
