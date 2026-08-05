import Link from "next/link";
import { getSession } from "../../src/web/auth/session.js";
import { redirect } from "next/navigation.js";
import { DashboardShell } from "../../src/web/components/dashboard-shell.js";

const areas = {
  admin: { label: "Verwaltung", description: "System, Benutzer und Integrationen verwalten.", icon: "A" },
  creator: { label: "Creator Studio", description: "Bot, Kanal und deine Community konfigurieren.", icon: "C" },
  viewer: { label: "Viewer Space", description: "Creator verfolgen und Community-Dienste nutzen.", icon: "V" },
};

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  return <DashboardShell user={user} label="Dein Konto" title={`Hallo, ${user.name}.`}>
    <section className="area-heading"><h2>Deine Bereiche</h2><p>Die Auswahl basiert automatisch auf deinen Berechtigungen.</p></section>
    <div className="area-grid">
      {user.roles.map((role) => <Link className="area-card" href={`/${role}`} key={role}>
        <span className="area-icon">{areas[role].icon}</span><div><h3>{areas[role].label}</h3><p>{areas[role].description}</p></div><b>›</b>
      </Link>)}
    </div>
  </DashboardShell>;
}
