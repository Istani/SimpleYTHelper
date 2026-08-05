# Phase 5 – Datenbank-Kopplung für Multi-Bot-Registrierungen und Ledger

**Stand:** implementiert, migriert und auf `ym-server` verifiziert  
**Datum:** 2026-08-05

## Ziel dieses Slices

Kopplung des Multi-Bot-Managers und des Idempotenz-Ledgers an die persistente PostgreSQL-Datenbank (`postgres.public` auf `ym-server`):
1. **Tabelle `discord_bot_registration`**: Speichert dauerhaft Bot-Registrierungen, die vom Betreiber bewusst zentral verwalteten Tokens im Klartext (`token`), spezifische `settings` (JSONB für Capabilities wie Befehle, Reports etc.), die zugehörige Discord User ID, den Aktivstatus (`is_active`) sowie Zeitstempel für Token-Rotationen (`rotated_at`).
2. **Erweiterung `discord_adapter_delivery`**: Das Delivery-Ledger wurde um `bot_id` erweitert und der Index (`adapter_delivery_ready_idx`) optimiert, damit Zustellungen und Idempotenz pro Bot isoliert und performant verwaltet werden.

## Ausführung & Evidenz

- **Prisma-Schema** erweitert (`prisma/schema.prisma`).
- **Migration** erstellt (`prisma/migrations/20260805191213_add_bot_id_and_bot_registration/migration.sql`) und erfolgreich auf den Remote-Container auf `ym-server` eingespielt.
- **Datenbank-Inspektion** bestätigt die korrekte Erstellung der Tabellen und Indizes im Schema `public`.

## Nächste Schritte

- Den Multi-Bot-Manager direkt mit Repository-Methoden gegen `prisma.discordBotRegistration` verknüpfen.
- Den Testlauf der Bot-Registrierung gegen die echte Remote-Datenbank ausführen.
