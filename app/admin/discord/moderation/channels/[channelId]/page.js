import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DashboardShell } from '../../../../../../src/web/components/dashboard-shell.js';
import { requireRole } from '../../../../../../src/web/auth/session.js';
import { getAdminPrisma } from '../../../../../../src/web/admin/prisma.js';
import { formatBerlinTimestamp } from '../../../../../../src/web/admin/live-status.js';
import { formatDiscordMessageMedia } from '../../../../../../src/web/message-media.js';

export default async function ChannelDetailPage({ params }) {
  const { channelId } = await params;
  const user = await requireRole('admin');
  const prisma = getAdminPrisma();
  const channel = prisma ? await prisma.discordChannel.findUnique({
    where: { id: channelId }, include: { guild: true, messages: { orderBy: { createdAt: 'desc' }, take: 100, include: { author: true, media: { orderBy: [{ kind: 'asc' }, { position: 'asc' }] } } } },
  }).catch(() => null) : null;
  if (!channel) notFound();
  const returnHref = channel.guildId ? `/admin/discord/moderation/guilds/${encodeURIComponent(channel.guildId)}` : '/admin/discord/moderation';
  return <DashboardShell user={user} label="Discord · Moderation" title={channel.name || 'Direktnachricht'}>
    <div className="detail-intro"><Link href={returnHref}>‹ Zurück</Link><p>{channel.guild?.name || 'Direkte Nachricht'} · Channel-ID: <code>{channel.id}</code></p></div>
    <section className="panel detail-panel"><div className="panel-title"><span className="kicker">Nachrichten</span><h2>Letzte 100 gespeicherte Nachrichten</h2></div>
      {channel.messages.length === 0 ? <p>Für diesen Channel sind noch keine Nachrichten gespeichert.</p> : <ol className="message-list">{channel.messages.map((message) => <li key={message.id}><header><strong>{message.author.globalName || message.author.username}</strong><small>{formatBerlinTimestamp(message.createdAt)}</small></header><p>{message.content || '—'}</p>{message.media.length > 0 && <ul className="message-media" aria-label="Zugehörige Medien">{message.media.map((media) => { const view = formatDiscordMessageMedia(media); return <li key={media.id}>{view.href ? <a href={view.href} target="_blank" rel="noreferrer">{view.icon} {view.text}</a> : <span>{view.icon} {view.text}</span>}</li>; })}</ul>}</li>)}</ol>}
    </section>
  </DashboardShell>;
}
