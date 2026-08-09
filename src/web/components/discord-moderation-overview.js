"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { discordModerationDestination } from '../admin/discord-moderation.js';
import { describeDirectMessage } from '../admin/discord-dm-presentation.js';

function formatSyncTime(value) { return value ? new Date(value).toLocaleString('de-DE') : 'noch kein erfolgreicher Full Sync'; }
function GuildAvatar({ guild }) { const label = guild.name.slice(0, 1).toUpperCase(); return guild.icon ? <img className="discord-avatar discord-avatar-small" src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`} alt={`Guild-Logo von ${guild.name}`} /> : <span className="discord-avatar discord-avatar-small avatar-fallback">{label}</span>; }
function DirectMessageAvatar({ channel }) { const dm = describeDirectMessage(channel); const participant = dm.participants[0]; return participant?.avatarUrl ? <img className="discord-avatar discord-avatar-small" src={participant.avatarUrl} alt={`Profilbild von ${participant.name}`} /> : <span className="discord-avatar discord-avatar-small avatar-fallback">{dm.label.slice(0, 1).toUpperCase()}</span>; }

function SourceList({ title, description, records, kind, panel = true }) {
  return <section className={panel ? 'panel moderation-list' : 'moderation-sublist'}><div className="panel-title"><span className="kicker">Discord · Moderation</span><h2>{title}</h2><p>{description}</p></div>{records === null ? <p>Wird automatisch geladen …</p> : records.length === 0 ? <p>Noch keine bekannten Einträge.</p> : <div className="entity-list">{records.map((record) => { const destination = discordModerationDestination(record, kind); const dm = kind === 'dm' ? describeDirectMessage(record) : null; return <Link href={destination.href} className={`entity-row${record.deletedAt ? ' entity-row-deleted' : ''}`} key={record.id}>{kind === 'guild' ? <GuildAvatar guild={record} /> : <DirectMessageAvatar channel={record} />}<span><strong>{dm?.label || destination.label}</strong><small>{dm?.description || `${record._count?.messages ?? 0} gespeicherte Nachrichten`}</small>{dm?.participants.length ? <small>Teilnehmer: {dm.participants.map((participant) => participant.name).join(', ')}</small> : null}{kind === 'guild' && record.botNames?.length ? <small>Bot: {record.botNames.join(', ')}</small> : null}{kind === 'guild' && record.selfbotNames?.length ? <small>Selfbot: {record.selfbotNames.join(', ')}</small> : null}{kind === 'guild' && record.botNames?.length === 0 && record.selfbotNames?.length === 0 ? <small>Keine Kontoquelle erfasst</small> : null}{record.deletedAt ? <small className="deleted-note">In Discord gelöscht: {new Date(record.deletedAt).toLocaleString('de-DE')}</small> : null}{kind === 'guild' ? <small>Letzter Full Sync: {formatSyncTime(record.lastFullSyncAt)}</small> : null}</span><b>›</b></Link>; })}</div>}</section>;
}

export function DiscordModerationOverview() {
  const [overview, setOverview] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { let active = true; fetch('/api/admin/discord/moderation/overview', { cache: 'no-store' }).then(async (response) => response.ok ? response.json() : Promise.reject()).then((payload) => { if (active) setOverview(payload); }).catch(() => { if (active) setFailed(true); }); return () => { active = false; }; }, []);
  const guildGroups = overview?.guildGroups || { withBots: null, selfbotOnly: null };
  return <div className="moderation-grid"><section className="panel moderation-list moderation-server-panel"><SourceList panel={false} title="Server mit Bots" description="Server, die durch eigene registrierte Bot-Konten beobachtet wurden." records={guildGroups.withBots} kind="guild" /><SourceList panel={false} title="Nur Selfbots" description="Server ohne eigene Bot-Observation, sichtbar über eigene Selfbot-Konten." records={guildGroups.selfbotOnly} kind="guild" /></section><SourceList title="Direkte Nachrichten" description="DM- und Gruppen-DM-Channels mit zuletzt bekannten Schreibenden und Profilbild." records={overview?.dms || null} kind="dm" />{failed ? <p role="alert">Die Discord-Übersicht konnte gerade nicht geladen werden.</p> : null}</div>;
}
