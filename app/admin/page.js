import { DashboardShell } from "../../src/web/components/dashboard-shell.js";
import { requireRole } from "../../src/web/auth/session.js";

export default async function AdminPage() {
  const user = await requireRole("admin");
  return <DashboardShell user={user} label="Verwaltung" title="Alles läuft ruhig.">
    <div>
      <div className="stats"><article><span>Services</span><strong>4</strong><small>1 bereit · 3 geplant</small></article><article><span>Creator</span><strong>—</strong><small>Identity-Anbindung folgt</small></article><article><span>System</span><strong className="good">Online</strong><small>Webfrontend erreichbar</small></article></div>
      <section className="panel"><div><span className="kicker">Systemübersicht</span><h2>Deine Kommandozentrale</h2></div><div className="service-list"><p><i className="dot good-bg"/>Webfrontend <b>Online</b></p><p><i className="dot good-bg"/>Discord Adapter <b>Vorbereitet</b></p><p><i className="dot muted-bg"/>Community API <b>Geplant</b></p></div></section>
      <section className="panel" style={{ marginTop: '20px' }}>
        <div>
          <span className="kicker">Discord Bot Management</span>
          <h2>Zentrale Bot-Registrierungen</h2>
          <p>
            Aktive Discord-Bots werden dynamisch aus der PostgreSQL-Tabelle <code>discord_bot_registration</code> geladen. Jeder Bot läuft isoliert mit seinen eigenen Capabilities (z. B. allowReports, listenMessages) und Gateway Intents.
          </p>
        </div>
        <div className="service-list">
          <p><i className="dot good-bg"/>Multi-Bot-Manager <b>Aktiv</b></p>
          <p><i className="dot good-bg"/>Bulk-Guild-Sync (Member/Roles/Channels) <b>Bereit</b></p>
          <p><i className="dot good-bg"/>Interne HTTP-API (<code>/internal/v1/bots</code>) <b>Gesichert</b></p>
        </div>
      </section>
    </div>
  </DashboardShell>;
}
