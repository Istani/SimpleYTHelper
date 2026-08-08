import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DashboardShell } from '../../../../../../src/web/components/dashboard-shell.js';
import { DiscordChannelMessages } from '../../../../../../src/web/components/discord-channel-messages.js';
import { requireRole } from '../../../../../../src/web/auth/session.js';
import { getAdminPrisma } from '../../../../../../src/web/admin/prisma.js';

export default async function ChannelDetailPage({ params }) {
  const { channelId } = await params;
  const user = await requireRole('admin');
  const prisma = getAdminPrisma();
  const channel = prisma ? await prisma.discordChannel.findUnique({ where: { id: channelId }, include: { guild: true } }).catch(() => null) : null;
  if (!channel) notFound();
  const returnHref = channel.guildId ? `/admin/discord/moderation/guilds/${encodeURIComponent(channel.guildId)}` : '/admin/discord/moderation';
  return <DashboardShell user={user} label="Discord · Moderation" title={channel.name || 'Direktnachricht'}>
    <div className={`detail-intro${channel.deletedAt ? ' detail-historical' : ''}`}><Link href={returnHref}>‹ Zurück</Link><p>{channel.guild?.name || 'Direkte Nachricht'} · Channel-ID: <code>{channel.id}</code></p>{channel.deletedAt ? <small className="history-badge">Historisch · in Discord gelöscht am {new Date(channel.deletedAt).toLocaleString('de-DE')}</small> : null}{channel.guild?.deletedAt ? <small className="history-badge">Zugehöriger Server ist historisch</small> : null}</div>
    <section className="panel detail-panel"><div className="panel-title"><span className="kicker">Nachrichten</span><h2>Gespeicherte Nachrichten</h2><p>Die neuesten 30 werden nach dem Rendern geladen; weitere Seiten nur auf Anforderung.</p></div><DiscordChannelMessages channelId={channel.id} /></section>
  </DashboardShell>;
}
