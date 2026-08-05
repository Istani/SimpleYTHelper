"use client";

import { useActionState } from "react";
import { createBotAction, updateBotAction } from "../../../app/admin/actions.js";

const initialState = {};
const defaultSettings = JSON.stringify({ allowReports: true, allowCommands: false, listenMessages: false }, null, 2);

function Notice({ state }) {
  if (state?.error) return <p className="form-notice form-error" role="alert">{state.error}</p>;
  if (state?.success) return <p className="form-notice form-success">{state.success}</p>;
  return null;
}

function CreateBotForm() {
  const [state, action, pending] = useActionState(createBotAction, initialState);
  return <form action={action} className="bot-form">
    <div className="bot-form-heading"><div><span className="kicker">Neue Instanz</span><h3>Discord-Bot registrieren</h3></div></div>
    <label>Interne Bot-ID<input name="botId" required minLength="3" maxLength="64" pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,63}" placeholder="community-reporter" /></label>
    <label>Discord Bot Token<input name="token" type="password" required minLength="20" autoComplete="new-password" placeholder="wird verschlüsselt übertragen und nie angezeigt" /></label>
    <label>Capabilities (JSON)<textarea name="settings" required defaultValue={defaultSettings} rows="5" spellCheck="false" /></label>
    <p className="form-hint">Aktive Bots werden beim nächsten Neustart des Discord-Adapters gestartet. Token erscheinen weder in der Liste noch in Antworten.</p>
    <Notice state={state} />
    <button className="button button-primary" disabled={pending}>{pending ? "Speichert …" : "Bot registrieren"}</button>
  </form>;
}

function BotEditForm({ bot }) {
  const [state, action, pending] = useActionState(updateBotAction, initialState);
  return <form action={action} className="bot-card">
    <input type="hidden" name="botId" value={bot.botId} />
    <div className="bot-card-heading"><div><strong>{bot.botId}</strong><small>Discord User ID: {bot.discordUserId || "Noch nicht verbunden"}</small></div><label className="switch"><input type="checkbox" name="isActive" defaultChecked={bot.isActive} /><span>Aktiv</span></label></div>
    <label>Capabilities (JSON)<textarea name="settings" required defaultValue={JSON.stringify(bot.settings || {}, null, 2)} rows="4" spellCheck="false" /></label>
    <label>Token rotieren <input name="token" type="password" minLength="20" autoComplete="new-password" placeholder="leer lassen, um den bestehenden Token zu behalten" /></label>
    <p className="form-hint">Ein eingetragener Token ersetzt den alten sofort; er kann anschließend nicht angezeigt werden.</p>
    <Notice state={state} />
    <button className="button button-secondary" disabled={pending}>{pending ? "Speichert …" : "Änderungen speichern"}</button>
  </form>;
}

export function BotManagementPanel({ bots }) {
  return <section className="bot-management">
    <CreateBotForm />
    <div className="bot-list">
      <div><span className="kicker">Bestehende Instanzen</span><h2>Registrierte Bot-Instanzen</h2></div>
      {bots.length === 0 ? <p>Noch keine Bots registriert. Lege die erste Instanz über das Formular an.</p> : bots.map((bot) => <BotEditForm key={bot.botId} bot={bot} />)}
    </div>
  </section>;
}
