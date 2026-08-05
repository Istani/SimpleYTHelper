import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../src/web/auth/session.js";
import { Logo } from "../src/web/components/logo.js";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="landing">
      <nav className="topbar">
        <Logo />
        <Link className="button button-ghost" href="/login">Anmelden</Link>
      </nav>
      <section className="hero">
        <div className="eyebrow">SimpleYTH Community Hub</div>
        <h1>Dein Stream.<br/><em>Eine Community.</em></h1>
        <p>Bot, Community-Dienste und Zuschauer-Aktionen an einem ruhigen, zentralen Ort.</p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/login">Jetzt anmelden</Link>
          <a className="button button-secondary" href="#bereiche">Bereiche entdecken</a>
        </div>
      </section>
      <section className="role-grid" id="bereiche" aria-label="Bereiche">
        <article><span>01</span><h2>Verwaltung</h2><p>Systemstatus, Nutzer und Integrationen sicher im Blick.</p></article>
        <article><span>02</span><h2>Creator Studio</h2><p>Bot verbinden, Dienste aktivieren und die eigene Community gestalten.</p></article>
        <article><span>03</span><h2>Viewer Space</h2><p>Lieblings-Creator folgen und interaktive Community-Dienste nutzen.</p></article>
      </section>
    </main>
  );
}
