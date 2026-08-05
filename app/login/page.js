import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../src/web/auth/session.js";
import { Logo } from "../../src/web/components/logo.js";

export default async function LoginPage({ searchParams }) {
  const session = await getSession();
  if (session) redirect("/dashboard");
  const query = await searchParams;
  const error = query.error === "invalid";

  return (
    <main className="auth-shell">
      <section className="auth-intro">
        <Logo inverse />
        <div><div className="eyebrow">Willkommen zurück</div><h1>Ein Login.<br/><em>Dein Bereich.</em></h1></div>
        <p>Deine Bereiche werden nach der Anmeldung automatisch und serverseitig freigeschaltet.</p>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Anmelden</h2>
          <p>Melde dich einmal an. Deine verfügbaren Bereiche werden automatisch erkannt.</p>
          {error && <div className="error" role="alert">E-Mail oder Passwort stimmen nicht.</div>}
          <form action="/api/auth/login" method="post">
            <label>E-Mail<input name="email" type="email" autoComplete="username" required placeholder="name@example.com"/></label>
            <label>Passwort<input name="password" type="password" autoComplete="current-password" required placeholder="••••••••"/></label>
            <button className="button button-primary full" type="submit">Anmelden</button>
          </form>
          <small>Deine Berechtigungen kommen aus deinem Konto. Zugangsdaten werden nie im Browser gespeichert.</small>
        </div>
      </section>
    </main>
  );
}
