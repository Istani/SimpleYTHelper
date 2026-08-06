import Link from 'next/link';
import { DashboardShell } from '../../../../src/web/components/dashboard-shell.js';
import { requireRole } from '../../../../src/web/auth/session.js';
import { getAdminPrisma } from '../../../../src/web/admin/prisma.js';
import { discordModerationDestination } from '../../../../src/web/admin/discord-moderation.js';

function SourceList({ title, description, records, kind }) {
  return <section className="panel moderation-list"><div className="panel-title"><span className="kicker">Discord · Moderation</span><h2>{title}</h2><p>{description}</p></div>
    {records.length === 0 ? <p>Noch keine bekannten Einträge.</p> : <div className="entity-list">{records.map((record) => {
      const destination = discordModerationDestination(record, kind);
      return <Link href={destination.href} className="entity-row" key={record.id}><span className="entity-mark">{kind === 'dm' ? '✉' : '◆'}</span><span><strong>{destination.label}</strong><small>{record._count?.messages ?? 0} gespeicherte Nachrichten</small></span><b>›</b></Link>;
    })}</div>}</section>;
}

export default async function DiscordModerationPage() {
  const user = await requireRole('admin');
  const prisma = getAdminPrisma();
  let guilds = [];
  let dms = [];
  if (prisma) {
    try {
      [guilds, dms] = await Promise.all([
        prisma.discordGuild.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { messages: true } } } }),
        prisma.discordChannel.findMany({ where: { guildId: null, type: { in: [1, 3] } }, orderBy: { updatedAt: 'desc' }, include: { _count: { select: { messages: true } } } }),
      ]);
    } catch {}
  }
  return <DashboardShell user={user} label="Discord · Moderation" title="Konversationen im Kontext prüfen.">
    <div className="moderation-grid"><SourceList title="Bekannte Server" description="Server öffnen, um Mitglieder, Rollen und Channels einzusehen." records={guilds} kind="guild" />
      <SourceList title="Direkte Nachrichten" description="Gespeicherte DM- und Gruppen-DM-Channels, getrennt von Servern." records={dms} kind="dm" /></div>
  </DashboardShell>;
}
