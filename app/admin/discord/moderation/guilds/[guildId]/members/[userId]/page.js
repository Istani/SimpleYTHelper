import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DashboardShell } from '../../../../../../../../src/web/components/dashboard-shell.js';
import { requireRole } from '../../../../../../../../src/web/auth/session.js';
import { getAdminPrisma } from '../../../../../../../../src/web/admin/prisma.js';

export default async function MemberModerationPage({ params }) {
  const { guildId, userId } = await params;
  const user = await requireRole('admin');
  const prisma = getAdminPrisma();
  const member = prisma ? await prisma.discordGuildMember.findUnique({ where: { guildId_userId: { guildId, userId } }, include: { guild: true, user: true, roles: { include: { role: true } } } }).catch(() => null) : null;
  if (!member) notFound();
  const displayName = member.nickname || member.user.globalName || member.user.username;
  const avatarUrl = member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.userId}/${member.user.avatar}.png?size=128` : null;
  return <DashboardShell user={user} label="Discord · Moderation" title={displayName}>
    <div className={`detail-intro${member.deletedAt ? ' detail-historical' : ''}`}><Link href={`/admin/discord/moderation/guilds/${encodeURIComponent(guildId)}`}>‹ Zurück zu {member.guild.name}</Link><div className="discord-entity-heading">{avatarUrl ? <img className="discord-avatar" src={avatarUrl} alt={`Profilbild von ${displayName}`} /> : <span className="discord-avatar avatar-fallback" aria-label={`Kein Profilbild für ${displayName}`}>{displayName.slice(0, 1).toUpperCase()}</span>}<p>Discord-ID: <code>{member.userId}</code></p></div>{member.deletedAt ? <small className="history-badge">Historisch · Mitgliedschaft in Discord beendet am {new Date(member.deletedAt).toLocaleString('de-DE')}</small> : null}</div>
    <section className="panel detail-panel"><div className="panel-title"><span className="kicker">Rollenhistorie</span><h2>Gespeicherte Rollen</h2></div>{member.roles.length ? <ul className="entity-list">{member.roles.map(({ role }) => <li className={`entity-row${role.deletedAt ? ' entity-row-deleted' : ''}`} key={role.id}><span className="entity-mark">◆</span><span><strong>{role.name}</strong>{role.deletedAt ? <small className="history-badge">Historische Rolle · gelöscht am {new Date(role.deletedAt).toLocaleString('de-DE')}</small> : <small>Aktive Rolle</small>}</span></li>)}</ul> : <p>Für diese Mitgliedschaft sind keine Rollen gespeichert.</p>}</section>
  </DashboardShell>;
}
