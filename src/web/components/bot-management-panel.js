"use client";

import { useActionState, useEffect, useState } from "react";
import { createBotAction, updateBotAction } from "../../../app/admin/actions.js";

const initialState = {};
const defaultSettings = JSON.stringify({ allowReports: true, allowCommands: false, listenMessages: false }, null, 2);
const REFRESH_INTERVAL_MS = 10_000;

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
    <p className="form-hint">Aktive Bots werden beim nächsten Polling-Intervall des Discord-Adapters gestartet. Token erscheinen weder in der Liste noch in Antworten.</p>
    <Notice state={state} />
    <button className="button button-primary" disabled={pending}>{pending ? "Speichert …" : "Bot registrieren"}</button>
  </form>;
}

function BotEditForm({ bot }) {
  const [state, action, pending] = useActionState(updateBotAction, initialState);
  const statusLabel = bot.online ? (bot.ready ? "Online & Bereit" : "Verbunden (lädt …)") : "Offline";
  const statusClass = bot.online && bot.ready ? "good-bg" : "muted-bg";
  return <form action={action} className="bot-card">
    <input type="hidden" name="botId" value={bot.botId} />
    <div className="bot-card-heading">
      <div>
        <strong>{bot.botId}</strong>
        <small>Discord User ID: {bot.discordUserId || "Noch nicht verbunden"}</small>
      </div>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }} aria-live="polite">
          <span className={`dot ${statusClass}`} style={{ display: "inline-block" }}></span>
          <small style={{ fontWeight: 700 }}>{statusLabel}</small>
        </div>
        <label className="switch"><input type="checkbox" name="isActive" defaultChecked={bot.isActive} /><span>Aktiv</span></label>
      </div>
    </div>
    <label>Capabilities (JSON)<textarea name="settings" required defaultValue={JSON.stringify(bot.settings || {}, null, 2)} rows="4" spellCheck="false" /></label>
    <label>Token rotieren <input name="token" type="password" minLength="20" autoComplete="new-password" placeholder="leer lassen, um den bestehenden Token zu behalten" /></label>
    <p className="form-hint">Ein eingetragener Token ersetzt den alten sofort; er kann anschließend nicht angezeigt werden.</p>
    <Notice state={state} />
    <button className="button button-secondary" disabled={pending}>{pending ? "Speichert …" : "Änderungen speichern"}</button>
  </form>;
}

export function BotManagementPanel({ bots }) {
  const [liveBots, setLiveBots] = useState(bots);

  useEffect(() => {
    let cancelled = false;
    async function refreshLiveStatus() {
      try {
        const response = await fetch("/api/admin/live-status", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (!cancelled && Array.isArray(payload.bots)) setLiveBots(payload.bots);
      } catch {
        // Preserve the last confirmed UI state during a transient polling error.
      }
    }

    refreshLiveStatus();
    const interval = window.setInterval(refreshLiveStatus, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return <section className="bot-management">
    <CreateBotForm />
    <div className="bot-list">
      <div><span className="kicker">Bestehende Instanzen</span><h2>Registrierte Bot-Instanzen</h2><small>Live-Status wird alle 10 Sekunden aktualisiert.</small></div>
      {liveBots.length === 0 ? <p>Noch keine Bots registriert. Lege die erste Instanz über das Formular an.</p> : liveBots.map((bot) => <BotEditForm key={bot.botId} bot={bot} />)}
    </div>
  </section>;
}
