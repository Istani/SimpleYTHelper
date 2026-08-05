# Phase 5 – Remote-Initialmigration auf ym-server (postgres.public)

**Stand:** erfolgreich angewendet und verifiziert  
**Datum:** 2026-08-05

## Ziel dieses Slices

Anwendung der versionierten Prisma-Initialmigration (`20260805180312_init/migration.sql`)
auf den produktiven PostgreSQL-Container (`postgres`) auf `ym-server` (`10.10.14.253`),
damit der Discord-Adapter und die Outbox-Dienste künftig mit den gemeinsamen Tabellen
in `postgres.public` kommunizieren können.

## Ausführung & Evidenz

Am 2026-08-05 wurde die Migration direkt in den Remote-Container eingespielt:

```bash
ssh ym-server 'docker exec -i postgres psql -U postgres -d postgres' < prisma/migrations/20260805180312_init/migration.sql
```

Prüfung der Tabellen im Schema `public` auf `ym-server`:

```text
               List of relations
 Schema |           Name           | Type  |  Owner   
--------+--------------------------+-------+----------
 public | community_outbox_event   | table | postgres
 public | discord_adapter_delivery | table | postgres
(2 rows)
```

Beide Tabellen (`community_outbox_event` und `discord_adapter_delivery`) sowie die
zugehörigen Enums und Indizes sind im Standard-Schema `public` der gemeinsamen
Datenbank `postgres` fehlerfrei angelegt.

## Nächste Schritte

1. **Testlauf des Adapters gegen die echte Remote-DB:** Mit gesetzter `DATABASE_URL`
   (inkl. Remote-IP/Zugangsdaten außerhalb von Git) die Runtime starten und
   Prisma-Operationen prüfen.
2. **Discord-Transport:** Den echten `discord.js`-Client (strikt getrennt vom Selfbot-Service)
   sowie den Outbox-Versand-Worker anbinden.
