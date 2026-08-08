"use client";

import { useEffect, useState } from 'react';
import { formatDiscordMessageMedia } from '../message-media.js';

function timestamp(value) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function DiscordChannelMessages({ channelId }) {
  const [state, setState] = useState({ items: [], nextCursor: null, loading: true, error: false });
  const load = async (cursor = null) => {
    setState((current) => ({ ...current, loading: true, error: false }));
    try {
      const query = new URLSearchParams({ limit: '30' });
      if (cursor) query.set('cursor', cursor);
      const response = await fetch(`/api/admin/discord/moderation/channels/${encodeURIComponent(channelId)}/messages?${query}`, { cache: 'no-store' });
      const payload = response.ok ? await response.json() : null;
      if (!payload || !Array.isArray(payload.items)) throw new Error('detail_unavailable');
      setState((current) => ({ items: cursor ? [...current.items, ...payload.items] : payload.items, nextCursor: payload.nextCursor || null, loading: false, error: false }));
    } catch {
      setState((current) => ({ ...current, loading: false, error: true }));
    }
  };
  useEffect(() => { load(); }, [channelId]);
  if (state.loading && state.items.length === 0) return <p>Nachrichten werden geladen …</p>;
  if (state.error && state.items.length === 0) return <p role="alert">Nachrichten konnten gerade nicht geladen werden.</p>;
  return <>{state.items.length === 0 ? <p>Für diesen Channel sind noch keine Nachrichten gespeichert.</p> : <ol className="message-list">{state.items.map((message) => <li key={message.id}><header><strong>{message.author.globalName || message.author.username}</strong><small>{timestamp(message.createdAt)}</small></header><p>{message.content || '—'}</p>{message.media.length > 0 && <ul className="message-media" aria-label="Zugehörige Medien">{message.media.map((media) => { const view = formatDiscordMessageMedia(media); return <li key={media.id}>{view.href ? <a href={view.href} target="_blank" rel="noreferrer">{view.icon} {view.text}</a> : <span>{view.icon} {view.text}</span>}</li>; })}</ul>}</li>)}</ol>}{state.error && <p role="alert">Weitere Nachrichten konnten gerade nicht geladen werden.</p>}{state.nextCursor ? <button className="button button-secondary" type="button" disabled={state.loading} onClick={() => load(state.nextCursor)}>{state.loading ? 'Lädt …' : 'Weitere Nachrichten laden'}</button> : null}</>;
}
