import { DashboardShell } from "../../src/web/components/dashboard-shell.js";
import { BotManagementPanel } from "../../src/web/components/bot-management-panel.js";
import { requireRole } from "../../src/web/auth/session.js";
import { publicBotRegistration } from "../../src/web/admin/bot-management.js";
import { formatBerlinTimestamp, mergeBotRuntimeStatus } from "../../src/web/admin/live-status.js";
import { formatDiscordMessageMedia } from "../../src/web/message-media.js";
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
  if (!internalToken) return [];

  try {
    const res = await fetch(`${adapterUrl}/internal/v1/bots`, {
      headers: { Authorization: `Bearer ${internalToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.bots) ? data.bots : [];
  } catch {
    return [];
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
      const adapterBots = await fetchAdapterBotStatuses();
      bots = mergeBotRuntimeStatus(records, adapterBots).map((record) => publicBotRegistration(record, record));

      const messages = await prisma.discordMessage.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: { author: true, channel: true, guild: true, media: { orderBy: [{ kind: 'asc' }, { position: 'asc' }] } },
      });

      const activeBotId = bots.find(b => b.isActive)?.botId || (bots[0]?.botId ?? "SimpleYTH");
      recentMessages = messages.map(msg => ({ ...msg, botId: activeBotId }));
    } catch {
      // The database-backed panels remain empty while PostgreSQL is unavailable.
    }
  }

  return <DashboardShell user={user} label="Verwaltung" title="Alles läuft ruhig.">
    <div>
      <div className="stats">
        <article><span>Reg. Bots</span><strong>{bots.length}</strong><small>{bots.filter((bot) => bot.isActive).length} aktiv</small></article>
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
                    const localTimeFormatted = formatBerlinTimestamp(message.createdAt);

                    return (
                      <tr key={message.id} style={{ borderBottom: "1px solid #e5e5e5" }}>
                        <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{localTimeFormatted}</td>
                        <td style={{ padding: "8px" }}><code>{message.botId}</code></td>
                        <td style={{ padding: "8px" }}>{message.guild?.name || message.guildId}</td>
                        <td style={{ padding: "8px" }}>#{message.channel?.name || message.channelId}</td>
                        <td style={{ padding: "8px" }}>{message.author?.username || message.authorId}</td>
                        <td style={{ padding: "8px", wordBreak: "break-word" }}>
                          <div>{message.content}</div>
                          {message.media?.length > 0 && (
                            <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0, display: "grid", gap: "3px" }} aria-label="Zugehörige Medien">
                              {message.media.map((media) => {
                                const presentation = formatDiscordMessageMedia(media);
                                return <li key={media.id}>
                                  {presentation.href ? (
                                    <a href={presentation.href} target="_blank" rel="noreferrer">{presentation.icon} {presentation.text}</a>
                                  ) : (
                                    <span>{presentation.icon} {presentation.text}</span>
                                  )}
                                </li>;
                              })}
                            </ul>
                          )}
                        </td>
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
