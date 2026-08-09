import Link from 'next/link';
import { DashboardShell } from '../../../../src/web/components/dashboard-shell.js';
import { requireRole } from '../../../../src/web/auth/session.js';
import { getAdminPrisma } from '../../../../src/web/admin/prisma.js';
import { discordModerationDestination } from '../../../../src/web/admin/discord-moderation.js';
import { describeDirectMessage, sortDirectMessagesByLatestMessage } from '../../../../src/web/admin/discord-dm-presentation.js';
import { partitionGuildsByObservedAccounts } from '../../../../src/web/admin/discord-guild-source-presentation.js';

function formatSyncTime(value) { return value ? new Date(value).toLocaleString('de-DE') : 'noch kein erfolgreicher Full Sync'; }
function GuildSyncFact({ guild }) { return guild.lastFullSyncFailedAt && (!guild.lastFullSyncAt || new Date(guild.lastFullSyncFailedAt) > new Date(guild.lastFullSyncAt)) ? <small>Letzter Full-Sync-Versuch fehlgeschlagen: {new Date(guild.lastFullSyncFailedAt).toLocaleString('de-DE')}</small> : <small>Letzter Full Sync: {formatSyncTime(guild.lastFullSyncAt)}</small>; }
function GuildAvatar({ guild }) { const label = guild.name.slice(0, 1).toUpperCase(); return guild.icon ? <img className="discord-avatar discord-avatar-small" src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`} alt={`Guild-Logo von ${guild.name}`} /> : <span className="discord-avatar discord-avatar-small avatar-fallback" aria-label={`Kein Guild-Logo für ${guild.name}`}>{label}</span>; }
function DirectMessageAvatar({ channel }) { const dm = describeDirectMessage(channel); const participant = dm.participants[0]; return participant?.avatarUrl ? <img className="discord-avatar discord-avatar-small" src={participant.avatarUrl} alt={`Profilbild von ${participant.name}`} /> : <span className="discord-avatar discord-avatar-small avatar-fallback" aria-label="Kein Profilbild verfügbar">{dm.label.slice(0, 1).toUpperCase()}</span>; }

function SourceList({ title, description, records, kind }) {
  return <section className="panel moderation-list"><div className="panel-title"><span className="kicker">Discord · Moderation</span><h2>{title}</h2><p>{description}</p></div>{records.length === 0 ? <p>Noch keine bekannten Einträge.</p> : <div className="entity-list">{records.map((record) => { const destination = discordModerationDestination(record, kind); const dm = kind === 'dm' ? describeDirectMessage(record) : null; return <Link href={destination.href} className={`entity-row${record.deletedAt ? ' entity-row-deleted' : ''}`} key={record.id}>{kind === 'guild' ? <GuildAvatar guild={record} /> : <DirectMessageAvatar channel={record} />}<span><strong>{dm?.label || destination.label}</strong><small>{dm?.description || `${record._count?.messages ?? 0} gespeicherte Nachrichten`}</small>{dm?.participants.length ? <small>Teilnehmer: {dm.participants.map((participant) => participant.name).join(', ')}</small> : null}{kind === 'guild' && record.observedAccountLabels?.length ? <small>Konten: {record.observedAccountLabels.join(', ')}</small> : null}{kind === 'guild' && record.observedAccountLabels?.length === 0 ? <small>Keine Kontoquelle erfasst</small> : null}{record.deletedAt ? <small className="deleted-note">In Discord gelöscht: {new Date(record.deletedAt).toLocaleString('de-DE')}</small> : null}{kind === 'guild' ? <GuildSyncFact guild={record} /> : null}</span><b>›</b></Link>; })}</div>}</section>;
}

export default async function DiscordModerationPage() {
  const user = await requireRole('admin');
  const prisma = getAdminPrisma();
  let guilds = []; let dms = []; let guildObservations = [];
  if (prisma) try { [guilds, dms, guildObservations] = await Promise.all([
    prisma.discordGuild.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { messages: true } } } }),
    prisma.discordChannel.findMany({ where: { guildId: null, type: { in: [1, 3] } }, include: { _count: { select: { messages: true } }, messages: { take: 1, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }, participants: { include: { user: { select: { id: true, username: true, globalName: true, avatar: true } } } } } }).then(sortDirectMessagesByLatestMessage),
    prisma.discordSourceObservation.findMany({ where: { entityType: 'guild' }, include: { source: { select: { botId: true, discordUserId: true, accountKind: true } } } }),
  ]); } catch {}
  const guildGroups = partitionGuildsByObservedAccounts(guilds, guildObservations);
  return <DashboardShell user={user} label="Discord · Moderation" title="Konversationen im Kontext prüfen."><div className="moderation-grid"><SourceList title="Server mit Bots" description="Server, die von offiziellen Bot-Konten beobachtet werden. Die zugehörigen Konten stehen jeweils in der Liste." records={guildGroups.withBots} kind="guild" /><SourceList title="Nur Selfbots" description="Server ohne offiziellen Bot; sichtbar über die aufgeführten Selfbot-Konten." records={guildGroups.selfbotOnly} kind="guild" /><SourceList title="Direkte Nachrichten" description="DM- und Gruppen-DM-Channels mit zuletzt bekannten Schreibenden und Profilbild." records={dms} kind="dm" /></div></DashboardShell>;
}
