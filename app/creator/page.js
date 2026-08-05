import { DashboardShell } from "../../src/web/components/dashboard-shell.js";
import { requireRole } from "../../src/web/auth/session.js";

export default async function CreatorPage() {
  const user = await requireRole("creator");
  return <DashboardShell user={user} label="Creator Studio" title={`Willkommen, ${user.name}.`}>
    <div className="stats"><article><span>Bot-Status</span><strong className="accent">Bereit</strong><small>Verbindung einrichten</small></article><article><span>Community</span><strong>0</strong><small>Mitglieder nach Launch</small></article><article><span>Dienste</span><strong>3</strong><small>Zur Konfiguration</small></article></div>
    <section className="panel highlight"><div><span className="kicker">Nächster Schritt</span><h2>Verbinde deinen Kanal</h2><p>Verknüpfe später Discord, Twitch oder YouTube und entscheide selbst, welche Dienste deine Zuschauer nutzen.</p></div><button className="button button-primary" disabled>Integration folgt</button></section>
  </DashboardShell>;
}
