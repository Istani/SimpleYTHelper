"use client";

import { useActionState } from 'react';
import { saveDiscordOAuthApplicationAction } from '../../../app/admin/actions.js';

const initialState = {};

export function DiscordOAuthConfigurationPanel({ configuration }) {
  const [state, action, pending] = useActionState(saveDiscordOAuthApplicationAction, initialState);
  return <section className="panel oauth-configuration">
    <div className="area-heading"><span className="kicker">Serverseitige OAuth-Anwendung</span><h2>Discord Developer Settings</h2><p>Die Client-ID und Callback-URL werden zentral gespeichert. Das Client-Secret wird verschlüsselt abgelegt, ausschließlich serverseitig zum Token-Austausch gelesen und nie wieder ausgegeben.</p></div>
    <form action={action} className="bot-form">
      <label>Discord Client-ID<input name="clientId" required inputMode="numeric" pattern="[0-9]{10,30}" defaultValue={configuration?.clientId || ''} autoComplete="off" /></label>
      <label>Callback-URL<input name="redirectUri" type="url" required defaultValue={configuration?.redirectUri || ''} placeholder="https://simpleyth.example/api/connections/discord/callback" /></label>
      <label>Discord Client-Secret<input name="clientSecret" type="password" minLength="8" autoComplete="new-password" placeholder={configuration?.configured ? 'Leer lassen, um das bestehende Secret zu behalten' : 'Beim ersten Speichern erforderlich'} required={!configuration?.configured} /></label>
      <label className="switch"><input name="isActive" type="checkbox" defaultChecked={configuration?.isActive ?? true} /><span>Discord-Verknüpfungen aktiv anbieten</span></label>
      <p className="form-hint">Für externe Domains ist HTTPS verpflichtend. Nach einer Secret-Rotation bleiben bereits verknüpfte Benutzerkonten erhalten; neue OAuth-Token-Austausche verwenden sofort die neue Developer-Konfiguration.</p>
      {state?.error && <p className="form-notice form-error" role="alert">{state.error}</p>}
      {state?.success && <p className="form-notice form-success">{state.success}</p>}
      <button className="button button-primary" disabled={pending}>{pending ? 'Speichert …' : 'Developer Settings speichern'}</button>
    </form>
  </section>;
}
