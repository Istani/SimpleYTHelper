# Phase 5 – Zentraler Datenbank-Start für Discord-Bots

**Stand:** implementiert, migriert und getestet
**Datum:** 2026-08-05

## Ziel

Der Discord-Adapter soll aktive Bot-Registrierungen beim Start zentral aus
`postgres.public.discord_bot_registration` laden, für jede Registrierung einen
separaten `discord.js`-Client starten und die von Discord gelieferte Bot User ID
persistieren. Es gibt keine Bot-Tokens in Docker Compose, Image, Git oder
pro-Bot-Environment-Dateien.

## Persistierte Registrierung

| Feld | Zweck |
|---|---|
| `bot_id` | stabile interne Kennung und Routing-Schlüssel |
| `token` | vom Betreiber bewusst zentral in PostgreSQL verwalteter Discord-Bot-Token |
| `settings` | JSONB-Capabilities, etwa `allowCommands`, `allowReports`, `listenMessages` |
| `discord_user_id` | nach erfolgreichem Login ermittelte Discord-Identität |
| `is_active` | bestimmt, ob die Instanz beim Adapterstart geladen wird |
| `rotated_at` | Auditzeitpunkt einer Tokenrotation |

## Runtime-Ablauf

1. Der Adapter erstellt einen Prisma-Client gegen die Runtime-`DATABASE_URL`.
2. Das Repository liest nur `is_active = true` Registrierungen.
3. Der Multi-Bot-Manager startet pro Row einen isolierten Client mit dem DB-Token
   und den zugehörigen Settings.
4. Nach `client.login()` wird `discord_user_id` in dieselbe Row zurückgeschrieben.
5. Beim Shutdown werden alle gestarteten Clients beendet, danach die Datenbankverbindung.

Message-reading Gateway Intents werden nur bei `listenMessages` oder
`allowCommands` angefordert; ein reiner Reporting-Bot erhält nur den Basis-Intent
`Guilds`.

## Sicherheitsrahmen

Die Klartextspeicherung wurde auf ausdrückliche Betreiberentscheidung gewählt
(siehe ADR-005). Sie ist deshalb kein versehentliches Logging- oder API-Verhalten:
Token dürfen nie in Antworten, Logs oder HTTP-Ausgaben erscheinen. Datenbankrechte
für die Tabelle bleiben auf Betreiber und Discord-Adapter begrenzt.

## Ausführungsevidenz

- Migration `20260805191614_store_cleartext_bot_token` auf `ym-server` erfolgreich
  angewendet; die Tabelle besitzt `token text NOT NULL`.
- `npx prisma generate` erfolgreich ausgeführt.
- `npm test`: **23/23** Tests grün.
- OpenAPI-Contract, Prisma-Validierung und Produktions-Dependency-Audit grün.

## Noch nicht ausgeführt

Es wurde bewusst kein echter Discord-Token eingetragen und kein Bot gegen Discord
angemeldet. Der nächste Test benötigt eine vom Betreiber angelegte aktive Row mit
einem Testbot-Token und geeigneten Discord-Developer-Portal-Intents.
