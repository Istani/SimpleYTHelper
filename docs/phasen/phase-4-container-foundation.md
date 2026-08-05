# Phase 4 – Lokale Container-Grundlage

**Stand:** lokale PostgreSQL-Grundlage und Initialmigration validiert
**Geltungsbereich:** ausschließlich der Modernisierungsbranch `docker-entwicklung`

## Umgesetzte Grundlage

`compose.yaml` definiert eine lokale PostgreSQL-16-Instanz als private Compose-Ressource:

- kein veröffentlichter Host-Port;
- internes Compose-Netzwerk;
- persistentes benanntes Volume;
- `pg_isready`-Healthcheck;
- kein Passwort, Token oder Discord-Credential in Git.

Zum Start muss `POSTGRES_PASSWORD` außerhalb des Repositories bereitgestellt werden. Die Datei nutzt eine Compose-Interpolation mit Pflichtwert, damit ein unabsichtlicher Start ohne Passwort scheitert.

## Noch nicht Bestandteil dieses Stands

Der Compose-Stack startet bewusst noch keine Community-API, keinen Worker und keinen Discord-Adapter. Diese Container folgen erst, wenn sie einen produktiven Entrypoint, ihren datenbesitzenden Zugriff, Healthchecks und die durch Mia abzusichernde Secret-/Netzwerkkonfiguration besitzen. Ein Test-Memory-Ledger darf nicht als Containerdienst ausgeführt werden.

## Nachweise

Die Compose-Konfiguration wird ohne Secretpersistenz mit einem nur prozesslokal gesetzten Prüfwert validiert:

```sh
POSTGRES_PASSWORD=local-validation-only docker compose -f compose.yaml config --quiet
```

Am 2026-08-05 wurde der Docker-Daemon erreicht und ein echter, vollständig
temporärer Smoke-Test ausgeführt:

1. PostgreSQL 16 wurde ausschließlich im internen Compose-Netz gestartet und
   erreichte seinen Healthcheck.
2. Prisma erzeugte und applizierte die Initialmigration
   `prisma/migrations/20260805174249_init/migration.sql` gegen diese frische,
   lokale Datenbank.
3. Eine SQL-Prüfung innerhalb des PostgreSQL-Containers bestätigte die Tabellen
   `community.outbox_event` und `discord_adapter.adapter_delivery`.
4. Der Test verwendete ein prozesslokal zufällig erzeugtes Passwort; danach
   wurden Container, Netzwerk und benanntes Volume wieder entfernt. Es wurde
   weder ein Datenbankport dauerhaft veröffentlicht noch eine Secret-Datei
   angelegt.

Der produktive PM2-/MariaDB-Bestand auf `defender833` war nicht Teil dieses
Tests und blieb unverändert.
