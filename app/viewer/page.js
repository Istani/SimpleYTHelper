import { DashboardShell } from "../../src/web/components/dashboard-shell.js";
import { requireRole } from "../../src/web/auth/session.js";

export default async function ViewerPage() {
  const user = await requireRole("viewer");
  return <DashboardShell user={user} label="Viewer Space" title={`Schön, dass du da bist, ${user.name}.`}>
    <div className="stats"><article><span>Communities</span><strong>0</strong><small>Creator entdecken</small></article><article><span>Aktivitäten</span><strong>—</strong><small>Noch ganz ruhig</small></article><article><span>Profil</span><strong className="good">Aktiv</strong><small>Zugang eingerichtet</small></article></div>
    <section className="panel"><div><span className="kicker">Community entdecken</span><h2>Deine Creator kommen hier zusammen.</h2><p>Sobald Creator ihre Kanäle verbunden haben, kannst du ihnen folgen und ihre interaktiven Dienste direkt nutzen.</p></div><button className="button button-secondary" disabled>Demnächst entdecken</button></section>
  </DashboardShell>;
}
