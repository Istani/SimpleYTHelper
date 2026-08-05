# Phase 5 – Multi-Bot-Manager und Konfigurationsarchitektur

**Stand:** implementiert und testgetrieben verifiziert  
**Datum:** 2026-08-05

## Konzept für Multi-Bot-Betrieb & Settings

Entsprechend Saschas architektonischer Vision läuft die Anbindung wie folgt:

1. **Registrierung über den Adapter:** Der Discord-Service verbindet sich beim Adapter und übergibt eine Liste von Bot-Registrierungen (bestehend aus `bot_id`, `token` und spezifischen `settings` wie z. B. Befehlserlaubnis, Report-Generierung oder Event-Listener).
2. **Start & Identifikation:** Der Multi-Bot-Manager startet jede Bot-Instanz individuell mit ihrem Token und ihren Einstellungen und meldet die ermittelten Discord User IDs (`discord_user_id`) an den Aufrufer zurück.
3. **Isolierte Zustellung & Ledger:** Jede Bot-Instanz ist logisch getrennt, sodass Zustellungen und Idempotenz-Ledger-Einträge (`discord_adapter_delivery`) exakt dem jeweiligen Bot bzw. der Instanz zugeordnet werden können.

## Umsetzung

- **`src/discord-adapter/multi-bot-manager.js`**: Implementiert `createMultiBotManager({ clientFactory })`.
  - Validiert Tokens und verhindert Duplikate (`bot_id`).
  - Führt den Login für jede Bot-Instanz aus und liest die `discord_user_id` aus.
  - Hält Instanzen und deren settings im Speicher bereit.
- **TDD-Absicherung**: In `test/multi-bot-manager.test.js` erfolgreich getestet.
- **Testergebnis**: Alle 18 Tests sind grün, OpenAPI-Vertrag und Prisma-Schema sind valide.
