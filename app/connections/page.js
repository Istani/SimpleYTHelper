import { DashboardShell } from '../../src/web/components/dashboard-shell.js';
import { getSession } from '../../src/web/auth/session.js';
import { getWebPrisma } from '../../src/web/auth/users.js';
import { redirect } from 'next/navigation.js';

const statusText = {
  connected: 'Discord ist jetzt mit deinem Konto verbunden.',
  cancelled: 'Die Discord-Verknüpfung wurde nicht abgeschlossen.',
  error: 'Discord konnte nicht verbunden werden. Bitte versuche es erneut.',
  'configuration-error': 'Die Discord-Verknüpfung ist noch nicht vollständig konfiguriert.',
};

export default async function ConnectionsPage({ searchParams }) {
  const user = await getSession();
  if (!user?.sub) redirect('/login');
  const prisma = getWebPrisma();
  const accounts = prisma ? await prisma.connectedAccount.findMany({
    where: { webUserId: user.sub },
    select: { id: true, provider: true, displayName: true, avatarUrl: true, scopes: true, tokenExpiresAt: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  }) : [];
  const params = await searchParams;
  const status = statusText[params?.discord];
  const discordAccount = accounts.find((account) => account.provider === 'discord');

  return <DashboardShell user={user} label="Konto" title="Verknüpfte Dienste">
    <section className="area-heading"><span className="kicker">Integrationen</span><h2>Deine Konten, deine Freigabe.</h2><p>Verbinde Dienste einmal mit deinem SimpleYTH-Konto. Zugriffstoken bleiben verschlüsselt und werden hier nie angezeigt.</p></section>
    {status && <p className={params.discord === 'connected' ? 'notice notice-success' : 'notice'} role="status">{status}</p>}
    <section className="panel">
      <div><span className="kicker">Discord</span><h2>{discordAccount ? 'Discord verbunden' : 'Discord verbinden'}</h2><p>{discordAccount ? `Verbunden als ${discordAccount.displayName}.` : 'Ermöglicht SimpleYTH, dein Discord-Profil und die Server abzurufen, für die du SimpleYTH Zugriff gewährst.'}</p></div>
      {discordAccount ? <a className="button button-secondary" href="/api/connections/discord/start">Erneut verbinden</a> : <a className="button button-primary" href="/api/connections/discord/start">Mit Discord verbinden</a>}
    </section>
    {discordAccount && <section className="panel"><div><span className="kicker">Verknüpfung</span><h2>{discordAccount.displayName}</h2><p>Berechtigungen: {discordAccount.scopes.join(', ') || 'keine Angaben'}. Letzte Aktualisierung: {discordAccount.updatedAt.toLocaleString('de-DE')}.</p></div></section>}
    <section className="area-grid integration-upcoming"><article className="area-card disabled"><span className="area-icon">T</span><div><h3>Twitch</h3><p>Folgt als nächster Dienst.</p></div></article><article className="area-card disabled"><span className="area-icon">Y</span><div><h3>YouTube</h3><p>Folgt als nächster Dienst.</p></div></article></section>
  </DashboardShell>;
}
