import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DashboardShell } from '../../../../../../src/web/components/dashboard-shell.js';
import { DiscordGuildDetailSections } from '../../../../../../src/web/components/discord-guild-detail-sections.js';
import { requireRole } from '../../../../../../src/web/auth/session.js';
import { getAdminPrisma } from '../../../../../../src/web/admin/prisma.js';

function HistoryBadge({ deletedAt }) {
  return deletedAt ? <small className="history-badge">Historisch · in Discord gelöscht am {new Date(deletedAt).toLocaleString('de-DE')}</small> : null;
}

function GuildAvatar({ guild }) {
  const label = guild.name.slice(0, 1).toUpperCase();
  return guild.icon ? <img className="discord-avatar" src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`} alt={`Guild-Logo von ${guild.name}`} /> : <span className="discord-avatar avatar-fallback" aria-label={`Kein Guild-Logo für ${guild.name}`}>{label}</span>;
}

export default async function GuildModerationPage({ params }) {
  const { guildId } = await params;
  const user = await requireRole('admin');
  const prisma = getAdminPrisma();
  const guild = prisma ? await prisma.discordGuild.findUnique({
    where: { id: guildId },
    include: { _count: { select: { members: true, channels: true, roles: true } } },
  }).catch(() => null) : null;
  if (!guild) notFound();
  return <DashboardShell user={user} label="Discord · Moderation" title={guild.name}>
    <div className={`detail-intro${guild.deletedAt ? ' detail-historical' : ''}`}><Link href="/admin/discord/moderation">‹ Zurück zur Moderation</Link><div className="discord-entity-heading"><GuildAvatar guild={guild} /><p>Serverdetails werden aus gespeicherten Discord-Metadaten dargestellt. Große Bereiche lädst du gezielt nach; Änderungen an Discord erfolgen hier nicht.</p></div><HistoryBadge deletedAt={guild.deletedAt} /><p><strong>Letzter erfolgreicher Full Sync:</strong> {guild.lastFullSyncAt ? new Date(guild.lastFullSyncAt).toLocaleString('de-DE') : 'noch keiner'}</p>{guild.lastFullSyncFailedAt && (!guild.lastFullSyncAt || new Date(guild.lastFullSyncFailedAt) > new Date(guild.lastFullSyncAt)) ? <p role="alert"><strong>Letzter Versuch fehlgeschlagen:</strong> {new Date(guild.lastFullSyncFailedAt).toLocaleString('de-DE')} · {guild.lastFullSyncError || 'Keine sichere Fehlerbeschreibung verfügbar.'}</p> : null}</div>
    <DiscordGuildDetailSections guildId={guild.id} counts={guild._count} />
  </DashboardShell>;
}
