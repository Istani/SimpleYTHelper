# SimpleYTH – Phase 0: Bestandsaufnahme

**Zeitpunkt:** 2026-07-30 (Remote-Prüfung auf `defender833`)  
**Methode:** ausschließlich lesende SSH-, Prozess-, Git-, MariaDB-Metadaten- und lokale HTTP-Prüfungen. Keine Dienste wurden gestoppt, keine Migration ausgeführt und keine Secretwerte ausgegeben.

## 1. Laufzeitbestand

- Zielhost erreichbar: `defender833` → `v18444.php-friends.de` (Linux 5.10.0-32-amd64).
- Produktivsystem: PM2 plus lokale MariaDB. MariaDB lauscht ausschließlich auf `127.0.0.1:3306`.
- Docker ist vorhanden, betreibt derzeit nur infrastrukturelle Container (`portainer-agent`, `alloy`, `wireguard`); **SimpleYTH läuft nicht in Compose/Docker**.
- PM2 meldet eine Versionsabweichung (Daemon 3.5.1, lokal installiert 6.0.13). Das ist ein Befund, keine Aufforderung zu `pm2 update`; im Rahmen von Phase 0 bleibt der produktive Prozessmanager unverändert.

## 2. Produktiv eingesetztes Repository

**Pfad:** `/root/SimpleYTHelper`  
**Git-Remote:** `Istani/SimpleYTHelper.git` (SSH-URL; Zugangsdaten nicht erfasst)  
**Branch / HEAD:** `master`, `31df646e` vom 2026-05-12  
**Arbeitsbaum:** lokal modifiziert: `gamesite/public/main.js`, `rpg/data/items.json`.

Damit ist ein möglicher Cutover ohne vorherige Sicherung bzw. Bereinigung des Arbeitsbaums nicht vertretbar.

Weitere gefundene Worktrees:

- `/root/syth-rpg-dev`: separater Entwicklungsstand mit Datenbank-Migrationsbibliothek.
- `/root/syth-rpg-dev_nx`: unvollständiger/gelöschter Arbeitsbaum auf `main`; derzeit keine belastbare Migrationsquelle.

## 3. Aktive PM2-Services

17 PM2-Appdefinitionen wurden aus dem produktiven PM2-Dump erfasst; 16 sind online, `SYTH-Core` ist gestoppt.

| Bereich | PM2-Service | Startdatei |
|---|---|---|
| Betrieb / Backup | `SYTH-Backup` | `cronjob/app.js` |
| Web | `SYTH-Web` | `website/app.js` |
| RPG | `SYTH-Rpg` | `rpg/app.js` |
| Discord-Bot | `SYTH-Discord` | `discord/app.js` |
| YouTube | `SYTH-YouTube`, `SYTH-YT-API` | `youtube/app.js`, `youtube/server.js` |
| Social / Commands | `SYTH-Twitch`, `SYTH-Twitter`, `SYTH-Commands` | jeweilige `app.js` |
| Game-Angebote | `GAME-Web`, `GAME-Sales`, `SYTH-Steam`, `SYTH-Humble`, `SYTH-GOG`, `SYTH-Epic`, `SYTH-Pokemon` | jeweilige `app.js` |

Alle aktiven SimpleYTH-Prozesse arbeiten aus demselben Checkout `/root/SimpleYTHelper`; sie teilen damit Codebasis, `.env` und Datenbankzugang.

## 4. Datenbankbestand und Kopplung

- Schema: `simpleyth` mit **32 InnoDB-Tabellen**.
- Größere Tabellen laut MariaDB-Metadaten: `import_steam_controller` (278.672 geschätzt), `short_url` (166.171), `chat_message` (15.669), `playlists_item` (5.605).
- Node-Abhängigkeiten im Hauptprojekt: `knex` 0.21.21, `objection` 2.2.16, `mysql` 2.18.1.
- Die produktive `knexfile.js` verwendet den Dialekt `mysql`; der Entwicklungsstand unter `syth-rpg-dev/libs/database` ebenso (zusätzlich SQLite-Konfiguration).
- Viele Modulordner enthalten jeweils eigene Model-Dateien, die Knex/Objection initialisieren. Daraus folgt eine breite, implizite Shared-DB-Kopplung statt klarer Service-Ownership.

## 5. HTTP- und Netzwerkbefund

Beobachtete Node-Listener: 3000, 3001, 3004, 3005, 3006, 4001 (alle auf `*`).

Lesende localhost-Smokes:

| Port | Ergebnis |
|---:|---|
| 3000 | HTTP 200, HTML |
| 3001 | TCP erreichbar, HTTP-Root liefert leere Antwort |
| 3004 | HTTP 404 |
| 3005 | HTTP 404 |
| 3006 | HTTP 404 |
| 4001 | HTTP 302 |

Die Statuscodes beweisen lediglich laufende Listener, nicht semantische API-Healthchecks. Versionierte HTTP-API-Verträge oder dedizierte `/health`-Endpunkte wurden in diesem Inventar nicht festgestellt.

## 6. Discord: Trennungsbefund

- Der laufende Service `SYTH-Discord` lädt `discord.js` 14.3.0, initialisiert `new Discord.Client(...)` und authentifiziert sich mit einer Token-Umgebungsvariable. Das ist als **Discord-Bot-Service** klassifiziert.
- In den produktiv laufenden Prozesspfaden und den untersuchten Discord-bezogenen Paketabhängigkeiten wurde **kein separater Discord-Selfbot-Service** identifiziert.
- Daher ist die geforderte Trennung derzeit nicht implementierbar zu behaupten: Entweder fehlt der Selfbot aus dem Checkout/Hostinventar oder er ist außerhalb des erfassten Produktivbestands betrieben. Vor jeder neuen Architektur muss sein tatsächlicher Standort, Zweck und Datenbedarf verifiziert werden.

## 7. Risiko- und Architekturfolgerungen

1. **Kein Big-Bang:** PM2 und MariaDB bleiben produktiv, bis ein freigegebener Cutover mit Datenvalidierung und getestetem Rollback existiert.
2. **Ownership zuerst:** Die 32 Tabellen müssen vor der PostgreSQL-Migration je Domäne (z. B. Chat/Discord, YouTube, RPG, Game-Katalog, Shortlinks) einem einzigen schreibenden Service zugeordnet werden.
3. **Keine neuen Direktzugriffe:** Neue oder extrahierte Services konsumieren versionierte HTTP APIs; sie teilen nicht erneut die Datenbank.
4. **PostgreSQL-Kompatibilität gezielt prüfen:** MySQL-spezifische Migrationen, SQL-Rohabfragen, Datentypen, Auto-Increment-/Index-Semantik und Zeichensatz/Collation müssen pro Tabelle erfasst und getestet werden.
5. **Konfigurationsgrenze:** `.env` enthält DB- und zahlreiche Drittanbieter-Credentials. Nur Namen wurden inventarisiert. Ein künftiges Compose-Design muss Secretinjektion ohne Git-, Image- oder Log-Leaks abbilden.

## 8. Empfohlene Phase-0-Abschlusskriterien vor Phase 1

1. Vollständige Tabelle-zu-Lese-/Schreibservice-Matrix aus statischer Analyse und MariaDB-Query-Log-/Runtime-Evidenz erstellen.
2. Tatsächlichen Discord-Selfbot-Bestand lokalisieren oder ausdrücklich als nicht mehr Teil des Zielsystems bestätigen.
3. Für die Listener 3000–4001 öffentliche Eintrittspunkte, Reverse-Proxy-Routing und gewünschte Healthcheck-Verträge erheben.
4. Den modifizierten produktiven Git-Arbeitsbaum sichern und seine Abweichungen fachlich zuordnen – ohne ihn zu bereinigen oder zu deployen.
5. PostgreSQL-Zielversion, Datenhaltungs-/Downtime-Vorgaben und das erste vertikale Migrationsslice entscheiden.
