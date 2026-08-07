# ADR-009: Discord-Guild-Full-Sync und tokenfreier Bot-Audit

- **Status:** akzeptiert
- **Datum:** 2026-08-06

## Kontext

Discord-Gateway-Events sind für die laufende Reconciliation nützlich, können aber verpasst werden. Die Moderationsdaten benötigen deshalb regelmäßig einen vollständigen, überprüfbaren Guild-Snapshot. Gleichzeitig müssen administrative Änderungen an SimpleYTH-Bot-Konfigurationen nachvollziehbar sein, ohne Zugangsdaten zu speichern.

## Entscheidung

1. Jeder aktive Bot fordert `Guilds` und den privilegierten `GuildMembers`-Intent an.
2. Ein Full Sync läuft nach `clientReady`, bei `guildCreate` und danach alle 24 Stunden. Der Timer wird beim Client-Shutdown bereinigt und hält den Prozess nicht künstlich am Leben.
3. Ein vollständiger Sync persistiert Guild, Channels, Rollen, Benutzer, Mitglieder und Memberrollen. Der Memberbestand wird transaktional als Snapshot ersetzt.
4. Zusätzlich werden `guildUpdate`/`guildDelete`, Channel-, Rollen- und Member-Create/Update/Delete-Events sofort persistiert. Entfernte Guilds, Channels, Rollen und Mitgliedschaften werden idempotent als historisch markiert; es erfolgt kein physisches Löschen der historischen Moderationsbasis. Ein erfolgreicher Full Sync behandelt Channels, Rollen und Mitglieder als vollständige Guild-Snapshots: aktive, darin nicht mehr enthaltene Datensätze erhalten ebenfalls `deleted_at`; zurückkehrende Datensätze werden per Upsert reaktiviert. Ereignisse derselben Guild werden in Empfangsreihenfolge serialisiert, damit ein späteres Löschereignis nicht von einer parallel noch laufenden Änderung wieder überschrieben wird.
5. `lastFullSyncAt` wird ausschließlich nach erfolgreichem vollständigem Persistenzpfad gesetzt. Ein Fehlschlag schreibt getrennt `lastFullSyncFailedAt` und einen auf 500 Zeichen begrenzten, tokenbereinigten Fehlertext. Der letzte Erfolg bleibt erhalten.
6. Bot-Anlage und -Änderungen erhalten tokenfreie Auditfakten mit Akteur, Aktion, Aktivstatus-/Capability-Diff und der Tatsache einer Tokenrotation. Tokenwerte werden nie in Audit, UI oder Logs geschrieben.
7. Der `GuildMembers`-Schalter im Discord Developer Portal bleibt externe Voraussetzung. Fehlt er oder scheitert der Fetch, wird kein erfolgreicher Vollständigkeitsstatus behauptet.

## Abnahme im Docker-Testbetrieb

Am 2026-08-06 wurde die Migration `20260806150000_add_discord_sync_status_and_bot_audit` auf `defender833` über die vorhandene PostgreSQL-Verbindung als Principal `postgres` ausgeführt. `prisma migrate status` bestätigte anschließend: **Database schema is up to date**.

Der Docker-Teststack wurde danach aus `docker-entwicklung` neu gebaut und ersetzt. Beide Dienste meldeten `healthy`; die Runtime-Healthchecks lieferten:

```json
{"status":"ok","service":"simpleyth-web"}
{"status":"ok"}
```

Der Discord-Adapter protokollierte `adapter_listening` auf Port 80 mit einem gestarteten Bot. Der vorhandene PM2-Prozess `SYTH-Discord` blieb dabei online (PID 1378) und wurde nicht angefasst.

## Event-Reconciliation und Soft Deletes

Discord-Lifecycle-Events aktualisieren Guilds, Channels, Rollen und Member zeitnah zwischen den Full-Sync-Läufen. Jede Guild wird seriell reconciliert, damit schnelle Ereignisfolgen nicht konkurrierend persistieren.

Entfernungen sind fachlich **Soft Deletes**: `DiscordGuild`, `DiscordChannel`, `DiscordRole` und `DiscordGuildMember` erhalten bei einem Discord-Löschereignis `deleted_at`. Es erfolgt kein physisches Löschen der historischen Moderations- oder Statistikbasis. Ein späterer Discord-Upsert setzt `deleted_at` wieder auf `NULL` und reaktiviert denselben Datensatz. Fachliche Folgeaufgaben müssen gelöschte Datensätze standardmäßig mit `deletedAt: null` ausschließen; Moderationsansichten dürfen sie ausschließlich als ausdrücklich gekennzeichnete Historie einschließen.

## Folgen

Die neue additive PostgreSQL-Migration `20260806150000_add_discord_sync_status_and_bot_audit` ist vor Ausrollen des neuen Adapters anzuwenden. Die PM2-/MariaDB-Produktivinstallation bleibt davon unberührt; Änderungen werden ausschließlich am Docker-Teststack auf `defender833` abgenommen.
