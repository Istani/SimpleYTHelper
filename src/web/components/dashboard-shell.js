import Link from "next/link";
import { Logo } from "./logo.js";

export function DashboardShell({ user, label, title, children }) {
  return <main className="dashboard">
    <aside>
      <Logo />
      <nav>
        <Link className="nav-active" href="/dashboard">Start</Link>
        {user.roles.includes("admin") && <><Link href="/admin">Verwaltung</Link><Link href="/admin/discord/moderation">Discord-Moderation</Link><Link href="/admin/discord/bots">Discord-Bots</Link><Link href="/admin/discord/oauth">Discord Developer Settings</Link></>}
        {user.roles.includes("creator") && <Link href="/creator">Creator Studio</Link>}
        {user.roles.includes("viewer") && <Link href="/viewer">Viewer Space</Link>}
        <Link href="/connections">Verknüpfte Dienste</Link>
        <span>Einstellungen</span>
      </nav>
      <form action="/api/auth/logout" method="post"><button className="logout">Abmelden</button></form>
    </aside>
    <section className="workspace">
      <header><div><span className="kicker">{label}</span><h1>{title}</h1></div><div className="avatar" title={user.email}>{user.name.slice(0, 1).toUpperCase()}</div></header>
      {children}
    </section>
  </main>;
}
