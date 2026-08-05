# SimpleYTH – Architektur- und Migrationsplanung

**Arbeitsbranch:** `docker-entwicklung`
**Aktualisiert:** 2026-08-05
**Geltungsbereich:** Architekturmodernisierung von SimpleYTH. Der produktive PM2-/MariaDB-Betrieb auf `defender833` bleibt unverändert, bis ein ausdrücklich freigegebener Cutover mit validierter Datenübernahme und Rollback vorliegt.

## Leitplanken

- Keine produktiven Dienste stoppen, keine Daten löschen und keine Migration ohne ausdrückliche Freigabe ausführen.
- Neue serviceübergreifende Kommunikation erfolgt ausschließlich über dokumentierte, versionierte HTTP-APIs oder einen explizit entschiedenen Event-Mechanismus. Neue direkte Datenbankzugriffe zwischen Services sind ausgeschlossen.
- Mehrere Dienste dürfen dieselbe PostgreSQL-Datenbank und das Schema `public` nutzen; diese physische gemeinsame Ablage ändert weder Tabellenownership noch das Verbot direkter serviceübergreifender Tabellenzugriffe.
- Bestehende Web-, OAuth- und Socket.IO-Ports sind keine bestehenden HTTP-API-Verträge. Ihre Rolle wird nur mit Konsumenten- und Quellcode-Evidenz klassifiziert.
- Discord-Bot und ein später nachgewiesener Discord-Selfbot bleiben getrennte Services: keine gemeinsamen Prozesse, Tokens, direkten Datenbankzugriffe oder Laufzeitkonfigurationen.
- Secrets gehören weder in Git noch in Images, Contracts, Testfixtures oder Logs.

## Status der Phasen

| Phase | Ziel | Status | Abnahmeevidenz / nächster Gate |
|---|---|---|---|
| 0 | Produktivbestand und Risiken erfassen | Erstinventar abgeschlossen | PM2-, Repo-, MariaDB- und Listenerinventar; vor Produktionseingriff erneut lesend aktualisieren |
| 1 | Datenownership, Kommunikation und Discord-Grenze erheben | Statische Analyse abgeschlossen, Entscheidung offen | Matrix und Kommunikationsgraph vorhanden; Runtime-/Helper-/Raw-SQL-Evidenz und Owner-ADR fehlen |
| 2 | API- und Delivery-Vertrag definieren | Discord-Contract v1 vorbereitet | OpenAPI und Retrysemantik vorhanden; Authentisierung/Rotation und persistentes Ledger offen |
| 3 | ersten vertikalen Slice planen | Gamecheck→Discord als Kandidat vorbereitet | Slicebeschreibung vorhanden; Owner-Grenze Game-Katalog/Community vor Implementierung entscheiden |
| 4 | Arbeitsstand und Implementierungsgrundlage absichern | offen | untracked Prototyp reproduzierbar auf Node 22 validieren und reviewen |
| 5 | Compose-/PostgreSQL-Implementierung | PostgreSQL-Ziel entschieden; Security-Gate offen | `ym-server`-PostgreSQL ist festgelegt; separater DB-Principal, Secret-Injektion, Worker, Adapter, Healthchecks und E2E-Smoke folgen erst nach dem Security-Gate |
| 6 | Staging, Cutover und Rollback | gesperrt bis Implementierungs- und Stagingevidenz | Kompatibilitätsmatrix, Probelauf, Datenvalidierung und Runbook |
| Webfrontend | Next.js-Container, automatischer Login und Mehrfachrollen | lokaler UI-Slice implementiert | Container healthy; Rollenüberschneidungen geprüft; Login, Rollen und Nutzerdaten müssen über `identity-api` an PostgreSQL angebunden werden |

Die ausführliche, priorisierte Abfolge mit Abhängigkeiten und Akzeptanzkriterien steht in [Phase 4 – Planreview](phasen/phase-4-planreview-2026-08-04.md).

## Verbindliche nächste Meilensteine

1. **M0 – Reproduzierbarer Arbeitsstand:** Unversionierte Paket-, Prisma-, Adapter- und Testartefakte getrennt reviewen; Node 22 verwenden; Tests, Contract- und Prisma-Validierung grün ausführen.
2. **M1 – Ergänzende lesende Evidenz:** Vollständige Datenzugriffs- und Entry-Point-Evidenz auf `defender833` aufnehmen, ohne Query-Logging oder Betriebsänderung ohne separate Freigabe.
3. **M2 – Owner-ADR:** Den Owner- und Ereignisfluss für Angebotsbenachrichtigungen entscheiden. Aktuelle Empfehlung: `game-catalog-api` besitzt Katalogzustand und erzeugt ein versioniertes Sale-Event; Community bestimmt Empfänger und erzeugt Zustellaufträge.
4. **M3 – Security-Gate mit Mia:** Authentisierung, Rotation, Netzgrenze und Secret-Injektion für den internen Discord-Adaptervertrag entscheiden.
5. **M4/M5 – Implementierung und lokales Compose:** Erst danach PostgreSQL-Outbox, Worker, persistentes Ledger, Adapter und automatisierten End-to-End-Smoke-Test umsetzen.
6. **M6/M7 – Staging und freigegebener Cutover:** Datenübernahme, Vergleich, Rollback und Go/No-Go prüfen, bevor PM2 oder MariaDB produktiv berührt werden.
7. **Identity-/PostgreSQL-Slice:** Identity-ADR erstellen; Konten, Passwort-Hashes bzw. OAuth-Identitäten, Mehrfachrollen, Creator-Profile und Community-Zuordnungen in PostgreSQL modellieren; `WEB_USERS_JSON` vor öffentlichem Betrieb vollständig ersetzen.

## Offene Architekturentscheidungen

- **D1:** Game-Katalog-/Community-Owner- und Eventgrenze im ersten Slice.
- **D2:** Interne Adapter-Authentisierung und Token-/Zertifikatsrotation (mit Mia).
- **D3:** PostgreSQL-Laufzeit-Ziel ist entschieden (ADR-003); Stagingstrategie, Datenhaltungs- und Downtime-Vorgaben bleiben offen.
- **D4:** Selfbot bleibt außerhalb des Zielsystems, bis ein separater Bestand nachgewiesen und entschieden ist.
- **D5:** Identity-Ownership, PostgreSQL-Tabellenschema, Session-Widerruf, OAuth-Provider sowie Datenschutz- und Aufbewahrungsregeln für Webkonten.

Offene Entscheidungen werden als ADR mit Optionen, Auswirkungen, Empfehlung und Freigabestatus geführt; sie werden nicht stillschweigend durch Implementierung ersetzt.
