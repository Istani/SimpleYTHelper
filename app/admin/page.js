import { DashboardShell } from "../../src/web/components/dashboard-shell.js";
import { requireRole } from "../../src/web/auth/session.js";
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

export default async function AdminPage() {
  const user = await requireRole("admin");
  const prisma = getPrisma();

  let bots = [];
  let recentMessages = [];

  if (prisma) {
    try {
      bots = await prisma.discordBotRegistration.findMany({
        orderBy: { createdAt: 'desc' },
      });
      recentMessages = await prisma.discordMessage.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          channel: true,
          guild: true,
        },
      });
    } catch {
      // DB not ready or unmigrated yet
    }
  }

  return <DashboardShell user={user} label="Verwaltung" title="Alles läuft ruhig.">
    <div>
      <div className="stats">
        <article><span>Reg. Bots</span><strong>{bots.length}</strong><small>{bots.filter(b => b.isActive).length} aktiv</small></article>
        <article><span>Nachrichten</span><strong>{recentMessages.length}</strong><small>erfasst</small></article>
        <article><span>System</span><strong className="good">Online</strong><small>Webfrontend & DB</small></article>
      </div>

      <section className="panel" style={{ marginTop: '20px', flexDirection: 'column', alignItems: 'stretch' }}>
        <div>
          <span className="kicker">Live Discord Bots</span>
          <h2>Registrierte Bot-Instanzen</h2>
          {bots.length === 0 ? (
            <p style={{ marginTop: '10px' }}>Noch keine Bots in <code>discord_bot_registration</code> hinterlegt. Trage einen Bot in der Datenbank ein, um ihn zu starten.</p>
          ) : (
            <div style={{ marginTop: '15px', display: 'grid', gap: '10px' }}>
              {bots.map((bot) => (
                <div key={bot.botId} style={{ padding: '12px 16px', background: '#f9f9f9', borderRadius: '10px', border: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{bot.botId}</strong> <small style={{ color: '#660000', marginLeft: '8px' }}>User ID: {bot.discordUserId || 'Nicht verbunden'}</small>
                  </div>
                  <div>
                    <span className={`dot ${bot.isActive ? 'good-bg' : 'muted-bg'}`} style={{ display: 'inline-block', marginRight: '6px' }}></span>
                    <small>{bot.isActive ? 'Aktiv' : 'Deaktiviert'}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="panel" style={{ marginTop: '20px', flexDirection: 'column', alignItems: 'stretch' }}>
        <div>
          <span className="kicker">Live Data Stream</span>
          <h2>Empfangene Nachrichten</h2>
          {recentMessages.length === 0 ? (
            <p style={{ marginTop: '10px' }}>Noch keine Nachrichten erfasst. Sobald der Bot Nachrichten empfängt und abspeichert, erscheinen sie hier in Echtzeit.</p>
          ) : (
            <div style={{ marginTop: '15px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e5e5', textAlign: 'left', color: '#606060' }}>
                    <th style={{ padding: '8px' }}>Zeitpunkt</th>
                    <th style={{ padding: '8px' }}>Gilde</th>
                    <th style={{ padding: '8px' }}>Kanal</th>
                    <th style={{ padding: '8px' }}>Autor</th>
                    <th style={{ padding: '8px' }}>Nachricht</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMessages.map((msg) => (
                    <tr key={msg.id} style={{ borderBottom: '1px solid #e5e5e5' }}>
                      <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{new Date(msg.createdAt).toLocaleTimeString()}</td>
                      <td style={{ padding: '8px' }}>{msg.guild?.name || msg.guildId}</td>
                      <td style={{ padding: '8px' }}>#{msg.channel?.name || msg.channelId}</td>
                      <td style={{ padding: '8px' }}>{msg.author?.username || msg.authorId}</td>
                      <td style={{ padding: '8px', wordBreak: 'break-word' }}>{msg.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  </DashboardShell>;
}
