# Phase 4 – Planreview und priorisierte Umsetzungsgates

**Stand:** 2026-08-04
**Scope:** Review der versionierten Architektur-, Vertrags- und Slice-Artefakte auf `docker-entwicklung` sowie des lokalen, noch unversionierten Prototypstands. Keine Änderung auf `defender833`, an PM2, MariaDB oder Secrets.

## 1. Belastbarer Iststand

| Bereich | Nachweis | Status |
|---|---|---|
| Produktivbestand | Phase 0: PM2 + lokale MariaDB auf `defender833`; produktiver Arbeitsbaum ist modifiziert | unverändert, Cutover gesperrt |
| Datenkopplung | Phase-1-Matrix: Shared-DB-System mit Mehrschreibern, insbesondere Chat, Tokens und Game-Katalog | Analyse ausreichend für Risiken, nicht für finalen Owner-Beschluss |
| Kommunikation | Phase-1-Graph: Web-/Socket.IO-Listener sind UI-/Browser-Grenzen, keine belegten Inter-Service-APIs | entschieden und dokumentiert |
| Discord-Grenze | Bot nachgewiesen; kein separater Selfbot innerhalb des geprüften Scope nachgewiesen | Bot als eigener Adapter; Selfbot nicht einplanen, solange nicht belegt |
| Zustellungsarchitektur | ADR-001 und Contract v1: PostgreSQL-Outbox, idempotente Adapterannahme, kein Broker im ersten Slice | Architekturentscheidung angenommen; Security-Details offen |
| Technologie-Standard | ADR-002: Node.js 22, JavaScript/ESM, Express, Prisma/PostgreSQL | angenommen |
| Lokaler Prototyp | unversionierte Paket-, Prisma-, Adapter- und Testdateien vorhanden | nicht abgenommen und nicht in den Git-Verlauf integriert |

Die Dokumente der Phasen 0–3 sind Planungs- und statische Analyseartefakte. Sie sind keine Runtime-Bestätigung für den heutigen Produktionszustand; jede produktionsrelevante Umsetzung benötigt vor dem Eingriff eine erneute, lesende Evidenzaufnahme.

## 2. Festgestellte Lücken und Blocker

1. **Owner-Grenze des ersten Slices ist widersprüchlich.** Die Ownership-Matrix ordnet `game_check`, `game_link`, `game_overview`, `game_genres` und `game_merch` dem `game-catalog-api` zu. Phase 3 bezeichnet Rabattvergleich und Routing dagegen als Aufgabe des `community-api`. Ohne explizite Grenzentscheidung würde der neue Slice dieselbe Ownership-Unklarheit nachbauen.
2. **Runtime-Evidenz fehlt für die endgültige Owner-ADR.** Mehrschreiber sind statisch belegt, aber konkrete Auslöser, Helper-/Raw-SQL-Pfade und die Leser pro produktiver Tabelle sind nicht vollständig runtime-bestätigt.
3. **Reverse-Proxy-/Entry-Point-Inventar ist offen.** Die Listener sind absichtlich nicht als APIs interpretiert worden; öffentliche Routen, Konsumenten und künftige Healthcheck-Grenzen müssen noch sauber kartiert werden.
4. **Selfbot ist negativ innerhalb des Untersuchungsbereichs belegt, global aber nicht ausgeschlossen.** Ein späterer Fund auf einem anderen Host oder als User-Service erfordert eine eigene ADR; bis dahin ist er nicht Teil des Compose-Ziels.
5. **Security-Design für den internen Adaptervertrag fehlt.** Der OpenAPI-Vertrag verlangt Authentisierung; Methode, Secret-/Token-Rotation, Netzgrenze und Betriebsverantwortung sind vor einer Implementierung mit Mia festzulegen.
6. **Der lokale Prototyp ist nicht reproduzierbar validiert.** Seine Dateien sind untracked. Der Testlauf scheitert bereits beim Laden von Express wegen fehlendem `iconv-lite`; außerdem läuft lokal Node `v26.5.1`, während das Manifest `>=22 <23` verlangt. Damit ist dieser Stand weder als abgenommen noch als deploybar zu behandeln.
7. **Compose, PostgreSQL-Probelauf, Worker und End-to-End-Smoketest fehlen.** Es gibt weder eine versionierte Compose-Definition noch eine getestete Datenbankmigration, ein Ledger-Backend oder einen Worker.

## 3. Entscheidungsbedarf

| ID | Entscheidung | Optionen | Empfehlung | Benötigt vor |
|---|---|---|---|---|
| D1 | Owner- und Ereignisgrenze für Angebotsbenachrichtigungen | (A) `community-api` übernimmt Katalogzustand; (B) `game-catalog-api` besitzt Angebotszustand und erzeugt ein versioniertes Sale-Event, Community entscheidet Empfänger/Outbox; (C) ein gemeinsamer Service | **B**: folgt der vorhandenen Matrix, hält Katalog und Community getrennt und verhindert neue Mehrschreiber | Schema- und Serviceimplementierung |
| D2 | Interne Adapter-Authentisierung und Netzgrenze | (A) kurzlebige Service-Tokens; (B) mTLS; (C) beides | Entscheidung mit Mia anhand Compose-/Secret-Betriebsmodell; keine implizite Bearer-Token-Implementierung | Discord-Adapterroute |
| D3 | PostgreSQL-Zielversion, Staging-Modell und Datenübernahme | (A) lokaler Test + dediziertes Staging; (B) nur lokaler Test; (C) produktionsnahes Shadow-Read | **A**: reproduzierbares Staging vor jedem produktiven Cutover | echte Datenmigration |
| D4 | Produktstatus des Discord-Selfbots | (A) nicht Teil des Zielsystems; (B) separater Service nach Nachweis | **A bis Gegenbeweis**: nicht als Service planen; bei Fund separate ADR und Compliance-Prüfung | Compose-Zielbild |

D1, D2 und D3 sind Freigabeentscheidungen. Die Empfehlung ersetzt keine Entscheidung durch Sascha bzw. den verantwortlichen Betrieb.

## 4. Priorisierte Meilensteine

| Priorität | Meilenstein | Abhängigkeiten | Konkrete Ergebnisse | Akzeptanzkriterien |
|---:|---|---|---|---|
| 0 | M0 – Arbeitsstand reproduzierbar machen | keine Produktionsänderung | Untracked Prototyp fachlich reviewen, absichtlich stagen oder verwerfen; Lockfile und `.gitignore` prüfen; Node-22-Toolchain verwenden | sauberer bzw. bewusst dokumentierter Git-Status; `npm ci` mit Node 22; `npm test`, Contract-Validierung und Prisma-Validierung grün |
| 1 | M1 – Runtime- und Datenzugriffsevidenz ergänzen | lesender Zugriff auf `defender833` | Rekursive Helper-/Raw-SQL-Zuordnung, Auslöser der Mehrschreiber, Reverse Proxy/öffentliche Routen/Browser-Konsumenten, erneuter Bot-/Selfbot-Scope | jede der 32 Tabellen hat Status `bestätigt`, `unklar` oder `verwaist`; kein Listener als API ohne Konsumenten- und Vertragsbeleg; Befund versioniert |
| 2 | M2 – Owner-ADR und Slicegrenze freigeben | M1, D1 | ADR mit Optionen für Game-Katalog, Community und Zustellungsrouting; klarer Owner pro neu angelegter PostgreSQL-Tabelle | angenommene ADR; kein neuer Service darf fremde Tabellen direkt lesen/schreiben; nachvollziehbarer Produzent → Event → Consumer-Fluss |
| 3 | M3 – Security- und Betriebsgrenze festlegen | D2, Mia | interner Authentisierungs-/Rotationsentwurf, Netzsegmentierung, Secret-Injektion, Log-Redaktion und Healthcheck-Verantwortung | Architekturentscheidung von Mia geprüft; keine Secrets in Repo, Image, Contractfixture oder Logs; Adapter verweigert nicht authentisierte Requests |
| 4 | M4 – Minimalen vertikalen Slice implementieren | M0–M3 | Versioniertes `game-catalog-api`- bzw. freigegebenes Owner-Modell, PostgreSQL-Schema, Outbox-Worker, persistentes Adapter-Ledger, Contract-Client und Fake-Discord | atomarer Domänenwrite + Outbox; paralleles Claiming ohne Doppelclaim; Ledger-Deduplizierung; alle Phase-2-Fehlerpfade automatisiert getestet |
| 5 | M5 – Lokales Compose-System verifizieren | M4, D3-Testanteil | Compose mit PostgreSQL, Owner-Service, Worker, Discord-Adapter/Fake; Healthchecks und E2E-Smoketest | frischer Start erfolgreich; Healthchecks grün; 202/Timeout/429/503/400/401/409 nach Contract getestet; keine externen Discord- oder Produktionszugriffe |
| 6 | M6 – Staging, Vergleich und Cutover-Runbook | M5, D3 vollständig, explizite Freigabe | MariaDB→PostgreSQL-Kompatibilitätsmatrix, Testdatenmigration, Dual-/Shadow-Vergleich, Validierungs- und Rollback-Runbook | dokumentierter, wiederholbarer Probelauf; Datenvalidierung und Rückfall ohne Datenlöschung; Go/No-Go-Kriterien und Verantwortliche benannt |
| 7 | M7 – Freigegebener produktiver Cutover | M6, ausdrückliche Nutzerfreigabe | kontrolliertes Zeitfenster und Durchführung nach Runbook | erst nach freigegebenem Go; PM2/MariaDB erst danach und nur gemäß geprüftem Rollbackplan ändern |

## 5. Nächste ausführbare Arbeit

Der nächste technische Schritt ist **M0**, nicht eine Erweiterung des Prototyps: Der unversionierte Arbeitsstand muss zunächst reproduzierbar auf Node 22 validiert und fachlich reviewt werden. Parallel darf M1 ausschließlich lesende Discovery auf `defender833` ergänzen. M2 implementiert erst nach D1 die Servicegrenze.

Bis M2 freigegeben ist, werden weder produktive PM2-/MariaDB-Dienste verändert noch neue Cross-Service-Datenbankzugriffe, Compose-Deployments oder PostgreSQL-Datenmigrationen eingeführt.
