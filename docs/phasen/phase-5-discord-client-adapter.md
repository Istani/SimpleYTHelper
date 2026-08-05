# Phase 5 – Discord-Client-Anbindung (Adapter-Wrapper)

**Stand:** implementiert und getestet  
**Datum:** 2026-08-05

## Ziel dieses Slices

Einbindung des `discord.js`-Clients als austauschbarer Adapter-Wrapper, der die
fachlichen Zustellungen (Zielkanal und Inhalt) über den echten Discord-Client
ausführt, ohne den bisherigen Legacy-Bot-Prozess zu stören oder die Trennung
zum Selfbot-Dienst zu verletzen.

## Umsetzung

- **`src/discord-adapter/discord-client.js`**: Implementiert `createDiscordClientAdapter({ client })`.
  - Prüft vor jedem Versand, ob der Client über `client.isReady()` bereit ist.
  - Holt den Zielkanal über `client.channels.fetch(target.channel_id)` ab.
  - Sendet die Nachricht via `channel.send(content)` und gibt `{ status: 'sent' }` zurück.
- **TDD & Tests**: In `test/discord-client-adapter.test.js` gegen Test-Fakes (Mock-Clients und Mock-Channels) verifiziert.
- **Integrität**: Alle 16 Unit-Tests, der OpenAPI-Contract und die Prisma-Validierung sind vollständig grün.

## Nächste Schritte

1. Den asynchronen Versand-Worker einbinden, der accepted-Einträge aus dem Prisma-Ledger
   greift, über den Discord-Client versendet und den Status in `discord_adapter_delivery`
   auf `sent` aktualisiert.
2. Token-Rotation und Auditing mit Mia abstimmen.
