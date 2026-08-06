import Link from 'next/link';
import { DashboardShell } from '../../src/web/components/dashboard-shell.js';
import { requireRole } from '../../src/web/auth/session.js';
import { discordServiceAreas } from '../../src/web/admin/discord-moderation.js';

export default async function AdminPage() {
  const user = await requireRole('admin');
  return <DashboardShell user={user} label="Verwaltung" title="Dienste strukturiert verwalten.">
    <section className="area-heading">
      <span className="kicker">Services</span>
      <h2>Discord</h2>
      <p>Discord ist der erste angebundene Dienst. Weitere Service-Module erscheinen künftig auf derselben Ebene.</p>
    </section>
    <div className="area-grid">
      {discordServiceAreas().map((area) => <Link className="area-card" href={area.href} key={area.href}>
        <span className="area-icon">{area.icon}</span><div><h3>{area.title}</h3><p>{area.description}</p></div><b>›</b>
      </Link>)}
    </div>
  </DashboardShell>;
}
