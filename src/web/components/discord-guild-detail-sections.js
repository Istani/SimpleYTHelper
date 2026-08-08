"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { describeDiscordChannel } from '../admin/discord-channel-presentation.js';

const sectionLabels = { members: 'Mitglieder', channels: 'Channels', roles: 'Rollen' };

function history(deletedAt) {
  return deletedAt ? <small className="history-badge">Historisch</small> : '—';
}

function LoadButton({ section, load, loading, hasMore, loaded, error }) {
  if (loaded && !hasMore && !error) return null;
  return <button className="button button-secondary" type="button" disabled={loading} onClick={() => load(section)}>{loading ? 'Lädt …' : hasMore ? `Weitere ${sectionLabels[section]} laden` : error ? `${sectionLabels[section]} erneut laden` : `${sectionLabels[section]} laden`}</button>;
}

export function DiscordGuildDetailSections({ guildId, counts }) {
  const [state, setState] = useState({});
  const load = async (section) => {
    const previous = state[section] || { items: [], nextCursor: null };
    setState((current) => ({ ...current, [section]: { ...previous, loading: true, error: false } }));
    try {
      const query = new URLSearchParams({ section, limit: '50' });
      if (previous.nextCursor) query.set('cursor', previous.nextCursor);
      const response = await fetch(`/api/admin/discord/moderation/guilds/${encodeURIComponent(guildId)}?${query}`, { cache: 'no-store' });
      const payload = response.ok ? await response.json() : null;
      if (!payload || !Array.isArray(payload.items)) throw new Error('detail_unavailable');
      setState((current) => ({ ...current, [section]: { items: [...previous.items, ...payload.items], nextCursor: payload.nextCursor || null, loading: false, error: false, loaded: true } }));
    } catch {
      setState((current) => ({ ...current, [section]: { ...previous, loading: false, error: true } }));
    }
  };
  useEffect(() => {
    load('members');
    load('channels');
  }, []);
  const sectionState = (section) => state[section] || { items: [], nextCursor: null, loaded: false, loading: false, error: false };
  const memberState = sectionState('members');
  const channelState = sectionState('channels');
  const roleState = sectionState('roles');
  return <div className="detail-grid">
    <section className="panel detail-panel"><div className="panel-title"><span className="kicker">Mitglieder</span><h2>Mitglieder und Rollen ({counts.members})</h2><p>Wird nach dem Seitenaufbau automatisch geladen.</p></div>{memberState.loaded && <div className="table-wrap"><table><thead><tr><th>Mitglied</th><th>Discord-ID</th><th>Rollen</th><th>Status</th></tr></thead><tbody>{memberState.items.map((member) => <tr className={member.deletedAt ? 'history-row' : ''} key={member.userId}><td><Link className="text-link" href={`/admin/discord/moderation/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(member.userId)}`}>{member.nickname || member.user.globalName || member.user.username}</Link></td><td><code>{member.userId}</code></td><td>{member.roles.length ? member.roles.map(({ role }) => <span className={role.deletedAt ? 'history-inline' : ''} key={role.id}>{role.name} </span>) : '—'}</td><td>{history(member.deletedAt)}</td></tr>)}</tbody></table></div>}{memberState.error && <p role="alert">Mitglieder konnten gerade nicht geladen werden.</p>}<LoadButton section="members" load={load} loading={memberState.loading} hasMore={memberState.loaded && Boolean(memberState.nextCursor)} loaded={memberState.loaded} error={memberState.error} /></section>
    <section className="panel detail-panel"><div className="panel-title"><span className="kicker">Channels</span><h2>Bekannte Channels ({counts.channels})</h2><p>Wird nach dem Seitenaufbau automatisch geladen.</p></div>{channelState.loaded && <div className="table-wrap"><table><thead><tr><th>Name</th><th>Typ</th><th>Nachrichten</th><th>Status</th><th></th></tr></thead><tbody>{channelState.items.map((channel) => { const type = describeDiscordChannel(channel); return <tr className={channel.deletedAt ? 'history-row' : ''} key={channel.id}><td><span className="discord-channel-name">{type.icon} {channel.name || 'Unbenannter Channel'}</span></td><td>{type.label}</td><td>{channel._count.messages}</td><td>{history(channel.deletedAt)}</td><td><Link className="text-link" href={`/admin/discord/moderation/channels/${encodeURIComponent(channel.id)}`}>Nachrichten ›</Link></td></tr>; })}</tbody></table></div>}{channelState.error && <p role="alert">Channels konnten gerade nicht geladen werden.</p>}<LoadButton section="channels" load={load} loading={channelState.loading} hasMore={channelState.loaded && Boolean(channelState.nextCursor)} loaded={channelState.loaded} error={channelState.error} /></section>
    <section className="panel detail-panel"><div className="panel-title"><span className="kicker">Rollen</span><h2>Bekannte Rollen ({counts.roles})</h2><p>Kann bei Bedarf geladen werden.</p></div>{roleState.loaded && <div className="table-wrap"><table><thead><tr><th>Rolle</th><th>Position</th><th>Status</th></tr></thead><tbody>{roleState.items.map((role) => <tr className={role.deletedAt ? 'history-row' : ''} key={role.id}><td>{role.name}</td><td>{role.position}</td><td>{history(role.deletedAt)}</td></tr>)}</tbody></table></div>}{roleState.error && <p role="alert">Rollen konnten gerade nicht geladen werden.</p>}<LoadButton section="roles" load={load} loading={roleState.loading} hasMore={roleState.loaded && Boolean(roleState.nextCursor)} /></section>
  </div>;
}
