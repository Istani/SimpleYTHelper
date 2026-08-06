# ADR-009: Discord-Guild-Full-Sync und tokenfreier Bot-Audit

- **Status:** akzeptiert
- **Datum:** 2026-08-06

## Kontext

Discord-Gateway-Events sind für die laufende Reconciliation nützlich, können aber verpasst werden. Die Moderationsdaten benötigen deshalb regelmäßig einen vollständigen, überprüfbaren Guild-Snapshot. Gleichzeitig müssen administrative Änderungen an SimpleYTH-Bot-Konfigurationen nachvollziehbar sein, ohne Zugangsdaten zu speichern.

## Entscheidung

1. Jeder aktive Bot fordert `Guilds` und den privilegierten `GuildMembers`-Intent an.
2. Ein Full Sync läuft nach `clientReady`, bei `guildCreate` und danach alle 24 Stunden. Der Timer wird beim Client-Shutdown bereinigt und hält den Prozess nicht künstlich am Leben.
3. Ein vollständiger Sync persistiert Guild, Channels, Rollen, Benutzer, Mitglieder und Memberrollen. Der Memberbestand wird transaktional als Snapshot ersetzt.
4. `lastFullSyncAt` wird ausschließlich nach erfolgreichem vollständigem Persistenzpfad gesetzt. Ein Fehlschlag schreibt getrennt `lastFullSyncFailedAt` und einen auf 500 Zeichen begrenzten, tokenbereinigten Fehlertext. Der letzte Erfolg bleibt erhalten.
5. Bot-Anlage und -Änderungen erhalten tokenfreie Auditfakten mit Akteur, Aktion, Aktivstatus-/Capability-Diff und der Tatsache einer Tokenrotation. Tokenwerte werden nie in Audit, UI oder Logs geschrieben.
6. Der `GuildMembers`-Schalter im Discord Developer Portal bleibt externe Voraussetzung. Fehlt er oder scheitert der Fetch, wird kein erfolgreicher Vollständigkeitsstatus behauptet.

## Folgen

Die neue additive PostgreSQL-Migration `20260806150000_add_discord_sync_status_and_bot_audit` ist vor Ausrollen des neuen Adapters anzuwenden. Die PM2-/MariaDB-Produktivinstallation bleibt davon unberührt; Änderungen werden ausschließlich am Docker-Teststack auf `defender833` abgenommen.
