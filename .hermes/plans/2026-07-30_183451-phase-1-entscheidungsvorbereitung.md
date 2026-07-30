# SimpleYTH – Nächste Architekturarbeit: Phase-1-Entscheidungsvorbereitung

> **Für Elena:** Dieser Plan ist ausschließlich Vorbereitung, Analyse und dokumentierte Entscheidungsfindung. Keine produktiven Services, Datenbanken oder Secrets ändern.

**Ziel:** Aus dem Phase-0-Inventar eine belastbare Entscheidungsgrundlage für Service-Schnitt, Datenownership und den ersten risikoarmen Modernisierungsslice schaffen.

**Architektur:** Der Branch `docker-entwicklung` bleibt zunächst bewusst codefrei und enthält nur versionierte Arbeitsdokumente. Die produktive PM2-/MariaDB-Landschaft auf `defender833` wird ausschließlich lesend untersucht. Erst nach bestätigter Ownership und API-Grenzen wird der neue Compose-/PostgreSQL-Zielstand implementiert.

**Technischer Kontext:** Legacy Node.js, PM2, MariaDB, Knex/Objection/MySQL; Zielbild Docker Compose, versionierte HTTP APIs, PostgreSQL.

---

## Task 1: Dokumentationsstruktur für Entscheidungen festziehen

**Ziel:** Jede fachliche und technische Entscheidung dauerhaft auffindbar machen.

**Dateien:**
- Bereits vorhanden: `docs/README.md`
- Bereits vorhanden: `docs/PLANUNG.md`
- Anlegen bei erster Entscheidung: `docs/adr/ADR-001-<titel>.md`

**Schritte:**
1. Phase- und Planungsdokumente als verbindliche Quellen im Branch beibehalten.
2. Für jede noch offene Architekturfrage eine ADR verwenden: Kontext, Optionen, Empfehlung, Auswirkungen, Freigabestatus.
3. Keine Entscheidungen nur im Chat belassen.

**Abnahme:** `docs/README.md` verlinkt alle Phasen- und ADR-Dokumente; jeder relevante Beschluss ist im Git-Verlauf nachvollziehbar.

## Task 2: Tabelle-zu-Service-Matrix erheben

**Ziel:** Für alle 32 Tabellen des Schemas `simpleyth` einen eindeutigen schreibenden Owner und alle bekannten Leser bestimmen.

**Dateien:**
- Anlegen: `docs/phasen/phase-1-datenownership-matrix.md`
- Optionales Zwischenartefakt: `docs/arbeitsnotizen/datenzugriffe-raw.md`

**Schritte:**
1. Statisch alle Knex-/Objection-Modelle, Raw-SQL-Aufrufe und Importpfade im produktiv eingesetzten Commit erfassen.
2. Die Befunde mit den PM2-Service-Einstiegspunkten korrelieren.
3. Für jede Tabelle Leser, Schreiber, Domäne, Kritikalität und Ziel-Owner dokumentieren.
4. Unklare Zuordnungen ausdrücklich als offene Punkte markieren, nicht raten.
5. Zur Validierung nur lesende Runtime-Evidenz (z. B. MariaDB-Metadaten und ggf. kontrolliertes Query-Logging nach separater Freigabe) verwenden.

**Abnahme:** Keine Tabelle bleibt ohne Owner-Status (`bestätigt`, `unklar` oder `verwaist`); neue direkte Cross-Service-DB-Zugriffe sind als Architekturverstoß erkennbar.

## Task 3: Discord-Grenze klären

**Ziel:** Den Bot und einen möglichen Selfbot fachlich, technisch und betrieblich eindeutig trennen.

**Dateien:**
- Anlegen: `docs/adr/ADR-001-discord-bot-und-selfbot-grenze.md`

**Schritte:**
1. Den Standort eines möglichen Selfbots außerhalb des bisherigen PM2-/Checkout-Inventars gezielt, aber lesend ermitteln.
2. Für Bot und Selfbot getrennt dokumentieren: Prozess, Discord-Identität, Berechtigungen, Datenzugriffe, externe APIs und Nachrichtenflüsse.
3. Wenn kein Selfbot mehr existiert: den Befund mit Zustimmung als nicht mehr Teil des Zielsystems festhalten.
4. Erst danach Zielverträge definieren: keine gemeinsame Prozessinstanz, keine gemeinsamen Token, keine neue direkte DB-Kopplung.

**Abnahme:** ADR enthält eine explizit freigegebene Grenze und eine klare Aussage, ob der Selfbot migriert, ersetzt oder außer Betrieb bleibt.

## Task 4: HTTP-Eintrittspunkte und Vertragslücken kartieren

**Ziel:** Aus den Listenern 3000–4001 fachliche Dienste und spätere API-Verantwortlichkeiten ableiten.

**Dateien:**
- Anlegen: `docs/phasen/phase-1-http-eintrittspunkte.md`
- Später anlegen: `contracts/openapi/` für versionierte Verträge

**Schritte:**
1. Reverse Proxy, DNS-/öffentliche Routen und tatsächliche lokale Listener nur lesend erfassen.
2. Für jeden Endpoint Konsumenten, Authentisierung, Rückgabeformate, Nebenwirkungen und Fehlerverhalten dokumentieren.
3. Bestehende UI-Routen von künftigen serviceübergreifenden APIs trennen.
4. Einen ersten kleinen API-Slice mit `/v1/...` und `/health` vorschlagen.

**Abnahme:** Jeder externe bzw. interservice relevante Aufruf hat einen Owner und ist entweder als Altlast, Vertragskandidat oder bewusst intern klassifiziert.

## Task 5: PostgreSQL-Fähigkeit ohne Cutover bewerten

**Ziel:** Migrationstauglichkeit pro Tabelle und Zugriffspfad bewerten, ohne MariaDB oder Produktivdaten anzutasten.

**Dateien:**
- Anlegen: `docs/phasen/phase-1-postgresql-kompatibilitaet.md`

**Schritte:**
1. MariaDB-Schema, Indizes, Zeichensätze, Defaults und Auto-Increment-Verwendung als Metadaten erfassen.
2. Migrationsdateien und Raw-SQL nach MySQL-spezifischen Semantiken prüfen.
3. Tabellen nach Risiko klassifizieren: niedrig, mittel, hoch.
4. Das erste vertikale Migrationsslice nur aus einer abgegrenzten, risikoarmen Domäne vorschlagen.
5. Datenvalidierung, Wiederanlauf und Rollback als Voraussetzungen formulieren – noch nicht ausführen.

**Abnahme:** Für den gewählten ersten Slice existiert eine testbare Kompatibilitäts- und Validierungscheckliste.

## Task 6: Zielbild und Implementierungsfreigabe vorbereiten

**Ziel:** Erst nach den Befunden eine belastbare Compose- und Implementierungsentscheidung treffen.

**Dateien:**
- Anlegen: `docs/adr/ADR-002-ziel-service-schnitt.md`
- Anlegen: `docs/phasen/phase-2-api-vertraege.md`
- Später anlegen: `compose.yaml`, `services/`, `contracts/openapi/`

**Schritte:**
1. Service-Schnitt, Datenownership und ersten API-Vertrag als Optionen mit Auswirkungen vorlegen.
2. PostgreSQL-Zielversion, Staging-Strategie, Cutover-Fenster und Rollback-Owner als explizite Entscheidungen einholen.
3. Erst nach Freigabe den bislang codefreien Branch mit Compose-Grundgerüst, Tests und Healthchecks beginnen.

**Abnahme:** Es liegt eine ausdrückliche Freigabe für einen konkreten, kleinen Implementierungsslice vor.

## Risiken und Schutzmaßnahmen

- **Produktionsrisiko:** PM2/MariaDB bleiben unverändert; alle Erhebungen sind lesend.
- **Dirty Worktree auf defender833:** keine Übernahme, Bereinigung oder Deployment ohne separate Sicherung und Freigabe.
- **Secret-Risiko:** nur Konfigurationsnamen, niemals Werte, in Artefakte oder Git aufnehmen.
- **Falscher Service-Schnitt:** vor Dockerisierung zuerst Ownership und HTTP-Grenzen entscheiden; Docker allein löst keine Shared-DB-Kopplung.
- **Git-Hygiene:** Vor jedem Commit ausschließlich beabsichtigte Dokumente stagen; Commit-Identität dieses Repos ist lokal auf `Elena Hermes-Agent <Sascha.U.Kaufmann+hermes.elena@googlemail.com>` gesetzt.

## Empfohlener nächster konkreter Schritt

**Task 2 – die Datenownership-Matrix.** Sie reduziert das größte Migrationsrisiko und liefert die Grundlage für Service-Schnitt, API-Verträge und PostgreSQL-Cutover.
