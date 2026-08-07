import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DashboardShell } from '../../../../../../src/web/components/dashboard-shell.js';
import { requireRole } from '../../../../../../src/web/auth/session.js';
import { getAdminPrisma } from '../../../../../../src/web/admin/prisma.js';

function HistoryBadge({ deletedAt }) {
  return deletedAt ? <small className="history-badge">Historisch · in Discord gelöscht am {new Date(deletedAt).toLocaleString('de-DE')}</small> : null;
}

export default async function GuildModerationPage({ params }) {
  const { guildId } = await params;
  const user = await requireRole('admin');
  const prisma = getAdminPrisma();
  const guild = prisma ? await prisma.discordGuild.findUnique({
    where: { id: guildId },
    include: {
      members: { include: { user: true, roles: { include: { role: true } } }, orderBy: { user: { username: 'asc' } } },
      channels: { orderBy: [{ position: 'asc' }, { name: 'asc' }], include: { _count: { select: { messages: true } } } },
      roles: { orderBy: [{ position: 'desc' }, { name: 'asc' }] },
    },
  }).catch(() => null) : null;
  if (!guild) notFound();
  return <DashboardShell user={user} label="Discord · Moderation" title={guild.name}>
    <div className={`detail-intro${guild.deletedAt ? ' detail-historical' : ''}`}><Link href="/admin/discord/moderation">‹ Zurück zur Moderation</Link><p>Serverdetails werden aus den gespeicherten Discord-Metadaten dargestellt; Änderungen an Discord selbst erfolgen hier nicht.</p><HistoryBadge deletedAt={guild.deletedAt} /><p><strong>Letzter erfolgreicher Full Sync:</strong> {guild.lastFullSyncAt ? new Date(guild.lastFullSyncAt).toLocaleString('de-DE') : 'noch keiner'}</p>{guild.lastFullSyncFailedAt && (!guild.lastFullSyncAt || new Date(guild.lastFullSyncFailedAt) > new Date(guild.lastFullSyncAt)) ? <p role="alert"><strong>Letzter Versuch fehlgeschlagen:</strong> {new Date(guild.lastFullSyncFailedAt).toLocaleString('de-DE')} · {guild.lastFullSyncError || 'Keine sichere Fehlerbeschreibung verfügbar.'}</p> : null}</div>
    <div className="detail-grid">
      <section className="panel detail-panel"><div className="panel-title"><span className="kicker">Mitglieder</span><h2>Mitglieder und Rollen</h2></div><div className="table-wrap"><table><thead><tr><th>Mitglied</th><th>Discord-ID</th><th>Rollen</th><th>Status</th></tr></thead><tbody>{guild.members.map((member) => <tr className={member.deletedAt ? 'history-row' : ''} key={member.userId}><td><Link className="text-link" href={`/admin/discord/moderation/guilds/${encodeURIComponent(guild.id)}/members/${encodeURIComponent(member.userId)}`}>{member.nickname || member.user.globalName || member.user.username}</Link></td><td><code>{member.userId}</code></td><td>{member.roles.length ? member.roles.map(({ role }) => <span className={role.deletedAt ? 'history-inline' : ''} key={role.id}>{role.name}{role.deletedAt ? ' (historisch)' : ''} </span>) : '—'}</td><td><HistoryBadge deletedAt={member.deletedAt} /></td></tr>)}</tbody></table></div></section>
      <section className="panel detail-panel"><div className="panel-title"><span className="kicker">Channels</span><h2>Bekannte Channels</h2></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Typ</th><th>Nachrichten</th><th>Status</th><th></th></tr></thead><tbody>{guild.channels.map((channel) => <tr className={channel.deletedAt ? 'history-row' : ''} key={channel.id}><td>{channel.name || 'Unbenannter Channel'}</td><td>{channel.type}</td><td>{channel._count.messages}</td><td><HistoryBadge deletedAt={channel.deletedAt} /></td><td><Link className="text-link" href={`/admin/discord/moderation/channels/${encodeURIComponent(channel.id)}`}>Nachrichten ›</Link></td></tr>)}</tbody></table></div></section>
      <section className="panel detail-panel"><div className="panel-title"><span className="kicker">Rollen</span><h2>Bekannte Rollen</h2></div><div className="table-wrap"><table><thead><tr><th>Rolle</th><th>Position</th><th>Status</th></tr></thead><tbody>{guild.roles.map((role) => <tr className={role.deletedAt ? 'history-row' : ''} key={role.id}><td>{role.name}</td><td>{role.position}</td><td><HistoryBadge deletedAt={role.deletedAt} /></td></tr>)}</tbody></table></div></section>
    </div>
  </DashboardShell>;
}
