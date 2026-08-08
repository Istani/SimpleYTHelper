# ADR-010: Isolierte, inbound-only Discord-Selfbot-Runtime

- **Status:** akzeptiert
- **Datum:** 2026-08-08

## Kontext

SimpleYTH modernisiert die Discord-Ingestion im freigegebenen Docker-Teststack auf
`defender833`. Neben offiziellen Discord-Bot-Accounts sollen bewusst unterstützte
Discord-Selfbots historische und laufende Daten **eingehend** erfassen können.

Die vorhandenen Legacy-Selfbots enthielten allerdings fachfremde Automationen:
Datei-Downloads in lokale Verzeichnisse, HTTP-Multipart-Uploads, Discord-Webhooks,
Cronjobs und `channel.send()`-Aufrufe. Diese Pfade sind nicht Teil der bestätigten
Modernisierung. Die PM2-/MariaDB-Produktion bleibt unverändert, insbesondere
`SYTH-Discord`.

Die Tokenverwaltung war bereits zentral in `discord_bot_registration` etabliert
(ADR-005). Ein zweites, unabhängiges Registrierungsmodell würde Credential-,
Audit- und Lifecycle-Logik duplizieren.

## Entscheidung

1. Die kanonische Registrierungstabelle erhält den expliziten Account-Typ
   `account_kind` mit den Werten `bot` und `selfbot`.
2. Beide Typen nutzen dieselbe fachliche Ingestion und kanonische PostgreSQL-
   Persistenz: Guilds, Channels, Rollen, Mitglieder, Nachrichten, Medienmetadaten,
   Source Observations und Scheduled Events.
3. Der technische Laufzeit-Schnitt bleibt strikt getrennt:
   - der offizielle Adapter lädt ausschließlich aktive `bot`-Registrierungen und
     nutzt die offizielle Discord-Client-Bibliothek;
   - der Selfbot-Adapter lädt ausschließlich aktive `selfbot`-Registrierungen und
     nutzt eine eigene Selfbot-Client-Factory, einen eigenen Entrypoint und einen
     eigenen Docker-Container.
4. Der Selfbot-Adapter ist inbound-only. Er enthält keine Delivery-Route, keine
   Webhook-Aufrufe, keine `channel.send()`-Funktion, keine Cronjobs und keine
   lokale Download-/Archivlogik.
5. Credentials bleiben write-only. Tokenwerte dürfen weder in UI, HTTP-Antworten,
   Audit-Daten, Logs, Git noch Container-Images erscheinen.
6. Capabilities werden ausschließlich aus den aktiven Einstellungen der jeweiligen
   Registrierung beziehungsweise Runtime abgeleitet, nie aus einem Token oder
   einer vermuteten Berechtigung.
7. `DiscordSourceObservation` dokumentiert, welche Registrierung eine Entität
   tatsächlich sehen konnte. Eine unvollständige Sicht eines einzelnen Accounts
   darf keinen globalen Soft Delete einer kanonischen Discord-Entität auslösen.
8. Discord Scheduled Events werden als eingehende, kanonische Daten persistiert.
   Sie implizieren keine Automatisierung, Benachrichtigung oder sonstige ausgehende
   Discord-Aktion.

## Datenschutz, Compliance und Betrieb

Selfbots verwenden Discord-Nutzeraccounts und können gegen Discord-Regeln
verstoßen oder Kontosperren auslösen. Ihre Aktivierung ist daher eine bewusste
Betreiberentscheidung pro Registrierung. Der Adminbereich kennzeichnet sie
sichtbar als `inbound-only`; die technische Trennung verhindert, dass ein
Selfbot versehentlich über den offiziellen Bot-Adapter gestartet wird.

Im Docker-Testbetrieb nutzt der Adapter die vorhandene, hostlokal injizierte
PostgreSQL-Verbindung zum PostgreSQL-Container auf `ym-server` (ADR-003,
ADR-006). Zugangsdaten bleiben außerhalb des Repositorys, der Images und der
Ausgaben. DDL wurde ausschließlich als Principal `postgres` angewendet.

## Migration und Abnahme

Die additive Migration
`20260808160000_add_discord_selfbot_sources_and_events` führt ein:

- PostgreSQL-Enum `discord_account_kind` und
  `discord_bot_registration.account_kind`,
- `discord_source_observation` samt eindeutiger Sichtbarkeitsrelation,
- `discord_scheduled_event` als kanonische Inbound-Projektion,
- Indizes für aktive Typ-Registrierungen, Observations und Event-Listen.

Am 2026-08-08 wurde sie auf dem PostgreSQL-Container auf `ym-server` als
`postgres` ausgeführt. Die Prisma-Migrationshistorie enthält danach denselben
SHA-256-Checksum wie die versionierte Migrationsdatei; beide neuen Tabellen und
die Enum-Spalte wurden per Datenbankmetadaten bestätigt.

Danach wurden im Docker-Teststack `web`, `discord-adapter` und
`discord-selfbot-adapter` neu gebaut und ersetzt. Alle drei Compose-Healthchecks
waren gesund. Der Selfbot-Statusendpunkt meldete bei keiner aktiven Registrierung
korrekt eine leere Runtime; der vorhandene PM2-Prozess `SYTH-Discord` blieb
online und wurde nicht geändert.

Die vollständige Node-Regression schloss mit 84 bestandenen Tests ab. Sie deckt
unter anderem Account-Typ-Isolation, write-only Tokenverhalten, Source
Observations, Scheduled-Event-Ingestion und das Fehlen einer Selfbot-
Delivery-Route ab.

## Folgen

- Die Admin-Oberfläche kann eine explizite Selfbot-Registrierung anlegen; erst
  eine bewusste Aktivierung startet eine Selfbot-Runtime.
- Gemeinsame Persistenz bedeutet keine neue serviceübergreifende Fremd-DB-
  Integration: beide Adapter sind Teile desselben Discord-Bounded-Contexts und
  besitzen eine gemeinsame kanonische Projektion.
- Eine spätere Versandfunktion ist ein separater Architekturauftrag. Sie benötigt
  explizite Zielauflösung, Audit, Idempotenz, Rate-Limits, Berechtigungsprüfung
  und eine neue Sicherheitsfreigabe.
- Die visuelle/copyseitige Admin-Portal-Abnahme folgt dem verbindlichen
  Lina-Review-Workflow und wird erst nach Zuweisung durchgeführt.
