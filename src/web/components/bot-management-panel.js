"use client";

import { useActionState, useEffect, useRef, useState } from 'react';
import { createBotAction, updateBotAction } from '../../../app/admin/actions.js';
import { activeBotCapabilities } from '../admin/discord-bot-capabilities.js';

const initialState = {};
const defaultSettings = { allowReports: true, allowCommands: false, listenMessages: false };
const REFRESH_INTERVAL_MS = 10_000;

function Notice({ state }) {
  if (state?.error) return <p className="form-notice form-error" role="alert">{state.error}</p>;
  if (state?.success) return <p className="form-notice form-success">{state.success}</p>;
  return null;
}

function CapabilityControls({ initial = defaultSettings }) {
  const [settings, setSettings] = useState({ ...defaultSettings, ...initial });
  return <fieldset className="capabilities"><legend>SimpleYTH-Capabilities</legend>{[
    ['listenMessages', 'Nachrichten erfassen'],
    ['allowCommands', 'Discord-Commands zulassen'],
    ['allowReports', 'Reports zulassen'],
  ].map(([key, label]) => <label key={key}><input type="checkbox" checked={settings[key]} onChange={(event) => setSettings({ ...settings, [key]: event.target.checked })} />{label}</label>)}<input type="hidden" name="settings" value={JSON.stringify(settings)} /></fieldset>;
}

function Dialog({ title, children, triggerLabel, primary = false }) {
  const ref = useRef(null);
  return <><button type="button" className={`button ${primary ? 'button-primary' : 'button-secondary'}`} onClick={() => ref.current?.showModal()}>{triggerLabel}</button><dialog ref={ref} className="admin-dialog"><div className="dialog-heading"><h2>{title}</h2><button type="button" className="dialog-close" aria-label="Dialog schließen" onClick={() => ref.current?.close()}>×</button></div>{children}</dialog></>;
}

function NewBotDialog() {
  const [state, action, pending] = useActionState(createBotAction, initialState);
  return <Dialog title="Discord-Bot registrieren" triggerLabel="Bot hinzufügen" primary><form action={action} className="bot-form dialog-form"><label>Interne Bot-ID<input name="botId" required minLength="3" maxLength="64" pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,63}" placeholder="community-reporter" /></label><label>Discord Bot Token<input name="token" type="password" required minLength="20" autoComplete="new-password" /></label><CapabilityControls /><p className="form-hint">Der Token wird nie angezeigt, protokolliert oder im Browser wieder ausgegeben. Aktive Bots werden vom Adapter beim nächsten Polling-Intervall übernommen.</p><Notice state={state} /><button className="button button-primary" disabled={pending}>{pending ? 'Speichert …' : 'Bot registrieren'}</button></form></Dialog>;
}

function BotConfigDialog({ bot }) {
  const [state, action, pending] = useActionState(updateBotAction, initialState);
  return <Dialog title={`${bot.botId} konfigurieren`} triggerLabel="Konfigurieren"><form action={action} className="bot-form dialog-form"><input type="hidden" name="botId" value={bot.botId} /><label className="switch"><input type="checkbox" name="isActive" defaultChecked={bot.isActive} /><span>Instanz aktiv</span></label><CapabilityControls initial={bot.settings} /><Notice state={state} /><button className="button button-primary" disabled={pending}>{pending ? 'Speichert …' : 'Änderungen speichern'}</button></form></Dialog>;
}

function TokenRotationDialog({ bot }) {
  const [state, action, pending] = useActionState(updateBotAction, initialState);
  return <Dialog title={`${bot.botId}: Token rotieren`} triggerLabel="Token rotieren"><form action={action} className="bot-form dialog-form"><input type="hidden" name="botId" value={bot.botId} /><input type="hidden" name="isActive" value={bot.isActive ? 'on' : ''} /><input type="hidden" name="settings" value={JSON.stringify(bot.settings || {})} /><label>Neuer Discord Bot Token<input name="token" type="password" required minLength="20" autoComplete="new-password" /></label><p className="form-hint">Der bisherige Token wird ersetzt und kann nicht wiederhergestellt oder angezeigt werden.</p><Notice state={state} /><button className="button button-primary" disabled={pending}>{pending ? 'Rotiere …' : 'Token ersetzen'}</button></form></Dialog>;
}

function AuditFacts({ audits = [] }) {
  if (!audits.length) return <p className="form-hint">Noch keine Konfigurationsänderung protokolliert.</p>;
  return <div className="audit-facts">{audits.map((audit, index) => <p key={`${audit.createdAt}-${index}`}><strong>{audit.action === 'created' ? 'Registriert' : 'Konfiguration geändert'}</strong> · {new Date(audit.createdAt).toLocaleString('de-DE')} · Akteur: <code>{audit.actorId}</code>{audit.details?.tokenRotated ? ' · Token rotiert' : ''}{Object.keys(audit.details?.capabilities || {}).length ? ` · Capabilities: ${Object.entries(audit.details.capabilities).map(([key, value]) => `${key} ${value.from ? 'an' : 'aus'}→${value.to ? 'an' : 'aus'}`).join(', ')}` : ''}</p>)}</div>;
}

function ActiveCapabilities({ settings }) {
  const capabilities = activeBotCapabilities(settings);
  return <section className="bot-capabilities" aria-label="Aktive Capabilities"><span className="kicker">Aktive Capabilities</span>{capabilities.length ? <ul>{capabilities.map((capability) => <li key={capability.key}>{capability.label}</li>)}</ul> : <p>Keine aktiven Capabilities.</p>}</section>;
}

function BotCard({ bot }) {
  const status = bot.online ? (bot.ready ? 'Online & bereit' : 'Verbunden, startet …') : 'Offline';
  return <article className="bot-card"><div className="bot-card-heading"><div><strong>{bot.botId}</strong><small>Discord-ID: {bot.discordUserId || 'Noch nicht verbunden'}</small></div><span className={`status-pill ${bot.online && bot.ready ? 'status-good' : 'status-muted'}`}>{status}</span></div><dl className="bot-meta"><div><dt>Instanz</dt><dd>{bot.isActive ? 'Aktiv' : 'Deaktiviert'}</dd></div><div><dt>Erstellt</dt><dd>{new Date(bot.createdAt).toLocaleDateString('de-DE')}</dd></div></dl><ActiveCapabilities settings={bot.settings} /><section className="bot-audit"><span className="kicker">Änderungshistorie</span><AuditFacts audits={bot.audits} /></section><div className="bot-actions"><BotConfigDialog bot={bot} /><TokenRotationDialog bot={bot} /></div></article>;
}

export function BotManagementPanel({ bots }) {
  const [liveBots, setLiveBots] = useState(bots);
  useEffect(() => { let cancelled = false; async function refresh() { try { const response = await fetch('/api/admin/live-status', { cache: 'no-store' }); const payload = response.ok ? await response.json() : null; if (!cancelled && Array.isArray(payload?.bots)) setLiveBots(payload.bots); } catch {} } refresh(); const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS); return () => { cancelled = true; window.clearInterval(interval); }; }, []);
  return <section className="bot-management"><div className="bot-list-heading"><div><span className="kicker">Bestehende Instanzen</span><h2>Bot-Übersicht</h2><small>Der Live-Status aktualisiert sich alle 10 Sekunden. Nachrichten werden zentral je Discord-Nachricht gespeichert, nicht pro Bot gezählt.</small></div><NewBotDialog /></div>{liveBots.length === 0 ? <section className="panel"><p>Noch keine Bots registriert.</p><NewBotDialog /></section> : <div className="bot-grid">{liveBots.map((bot) => <BotCard bot={bot} key={bot.botId} />)}</div>}</section>;
}
