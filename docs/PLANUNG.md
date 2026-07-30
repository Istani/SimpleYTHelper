# SimpleYTH – Architektur- und Migrationsplanung

**Arbeitsbranch:** `architecture/phase-0-workspace`  
**Geltungsbereich:** Architekturmodernisierung von SimpleYTH; der produktive PM2-/MariaDB-Betrieb auf `defender833` bleibt unverändert, bis ein ausdrücklich freigegebener Cutover validiert ist.

## Leitplanken

- Keine produktiven Dienste stoppen, keine Daten löschen und keine Migration ohne Freigabe ausführen.
- Neue serviceübergreifende Kommunikation ausschließlich über dokumentierte, versionierte HTTP APIs – keine neuen direkten Datenbankzugriffe.
- Discord-Bot und ein möglicher Discord-Selfbot werden als getrennte Services mit getrennten Laufzeit-, Konfigurations- und Berechtigungsgrenzen behandelt.
- Secrets gehören weder in Git noch in Images oder Logs.

## Phasenübersicht

| Phase | Ziel | Abnahmeevidenz | Status |
|---|---|---|---|
| 0 | Bestand und Risiken erfassen | Laufzeit-, Repo-, DB- und Listenerinventar | abgeschlossen (Erstinventar) |
| 1 | Datenownership und Ziel-Service-Schnitt entscheiden | Tabelle-zu-Service-Matrix, Kontextgrenzen, offene ADRs | offen |
| 2 | HTTP-API-Verträge definieren | versionierte OpenAPI-/Contract-Artefakte, Auth- und Fehlerkonzept | offen |
| 3 | PostgreSQL-Migrationsdesign validieren | Typ-/SQL-Kompatibilitätsmatrix, Probelauf, Validierungsplan | offen |
| 4 | Compose- und Implementierungsbacklog aufbauen | Service-Definitionen, Build/Test/Healthcheck-Konzept | offen |
| 5 | Staging, Cutover und Rollback testen | vollständige Smoke- und Datenvalidierung, freigegebener Runbook-Entwurf | offen |

## Nächste verbindliche Arbeitspakete

1. Jede Tabelle des Schemas `simpleyth` genau einem schreibenden fachlichen Owner zuordnen; Leser und Schreibpfade mit Quell- und Runtime-Evidenz erfassen.
2. Den tatsächlichen Standort und Umfang eines Discord-Selfbots klären. Der Phase-0-Bestand belegt nur den Bot-Service `SYTH-Discord`.
3. Für die lokalen Listener und öffentlichen Eintrittspunkte Reverse Proxy, Verbraucher und gewünschte Healthchecks erheben.
4. Die beiden lokalen Änderungen im produktiven Checkout fachlich sichern und bewerten, ohne sie dort zu verändern.
5. Erst danach einen vertikalen Migrationsslice auswählen; empfohlen ist ein klar abgegrenzter, risikoarmer Bereich ohne OAuth-/Token-Tabellen.

## Entscheidungslog

Architekturentscheidungen werden künftig als eigene ADRs unter `docs/adr/` abgelegt. Jede ADR dokumentiert Kontext, Optionen, Empfehlung, Auswirkungen und Freigabestatus.
