# SimpleYTH – Phase 1: Datenownership-Matrix (statische Erhebung)

**Stand:** 2026-07-30  
**Evidenz:** ausschliesslich lesende statische Analyse des produktiv eingesetzten Checkouts `/root/SimpleYTHelper` auf `defender833`, korreliert mit dem Phase-0-PM2-Bestand und MariaDB-Schema-Metadaten. Die Analyse umfasst die Service-Einstiegspunkte **und** rekursiv alle handgeschriebenen JavaScript-Dateien ausserhalb von `node_modules`, `.git` und den kopierten `models/`-Verzeichnissen.

> **Wichtig:** `R`, `C`, `U`, `D` beschreiben potenzielle Lese-, Create-, Update- und Delete-Operationen, die aus Model-Imports und zugehörigen `query()`-Aufrufen statisch abgeleitet wurden. Das ist noch kein Runtime-Beweis und kein berechtigter Produktions-Query-Log-Ersatz. Ein Service kann durch seine kopierten Model-Dateien eine Tabelle kennen, ohne sie in seiner Einstiegspunktdatei tatsächlich zu verwenden.

## 1. Zentrales Ergebnis

Die Legacy-Codebasis enthält pro Modul nahezu vollständige Kopien der Objection-/Knex-Modelle. Dadurch ist Modellverfügbarkeit kein Ownership-Signal. Entscheidend sind die tatsächlich in Service-Einstiegspunkten importierten Modelle und ihre erkannten `query()`-Ketten.

Die wichtigsten bestätigten Mehrschreiber-Konflikte sind:

- **Chat-Domäne:** `discord`, `twitch`, `youtube` und teilweise `chatcommands` schreiben dieselben Tabellen (`chat_message`, `chat_room`, `chat_server`, `chat_user`, `outgoing_messages`).
- **OAuth-/Kanal-Domäne:** `website`, `youtube`, `twitch`, `discord` schreiben bzw. verändern `channel` und `syth_token`.
- **Game-Katalog:** `steam`, `gog`, `epicstore`, `amazon` und `gamecheck` schreiben überlappend `game_overview`, `game_link`, `game_genres`, `game_merch` und `game_check`.

Damit ist eine 1:1-Dockerisierung der bestehenden PM2-Apps **keine** Service-Modernisierung. Vor dem PostgreSQL-Cutover braucht jeder Datenbereich einen einzigen schreibenden Owner und APIs für alle übrigen Verbraucher.

## 2. Vorschlag für fachliche Ziel-Owner

| Domäne | Tabellen | Vorgeschlagener schreibender Ziel-Service | Begründung / Status |
|---|---|---|---|
| Community / Chat | `chat_message`, `chat_room`, `chat_server`, `chat_user`, `outgoing_messages`, `channel` | `community-api` | Mehrere Plattformadapter schreiben heute parallel. Discord, YouTube, Twitch und RPG sollen über einen API-Owner arbeiten. **Entscheidung offen.** |
| Identity / Integrationen | `syth_login`, `syth_token`, `vip_member` | `identity-api` | Website besitzt Login-/OAuth-Flüsse; Tokens werden zugleich von Plattformdiensten verändert. **Entscheidung offen.** |
| Video / Broadcast | `broadcasts`, `playlists`, `playlists_item`, `videos` | `media-api` | YouTube ist Hauptschreiber, Website und Chatcommands sind überwiegend Leser. **Hohe Zuversicht.** |
| RPG | `rpg_char`, `rpg_inventory`, `rpg_log`, `rpg_monster`, `rpg_story`, `rpg_itmes` | `rpg-api` | RPG schreibt Kernobjekte, Website liest einen Teil. Tabellen ohne statischen Query-Treffer müssen noch verifiziert werden. **Hohe Zuversicht.** |
| Game-Katalog | `game_overview`, `game_link`, `game_genres`, `game_merch`, `game_check`, `import_steam_controller` | `game-catalog-api` | Importer und Angebotsdienste sollen keine Tabellen mehr direkt teilen. **Hohe Zuversicht.** |
| Publishing / Social | `send_tweet`, `short_url`, `own_advertising` | `publishing-api` | Twitter und Gamecheck schreiben Social-Queue; Shortlink- und Werbezugriffe müssen weiter untersucht werden. **Mittlere Zuversicht.** |
| Metrik / technische Historie | `metagamerscore`, `migrations`, `migrations_lock` | je Domäne / Datenplattform | Keine Produkt-Ownership aus statischer Analyse ableitbar; `migrations*` sind technische Tabellen. **Nicht als erster Migrationsslice.** |

## 3. Statisch beobachtete Zugriffsmatrix

| Tabelle | Statische Service-Evidenz | Vorgeschlagener Owner | Status |
|---|---|---|---|
| `broadcasts` | Twitch C; YouTube C/U/D | `media-api` | Mehrschreiber |
| `channel` | Discord C; RPG R; Twitch C; Website R; YouTube C | `community-api` | Mehrschreiber |
| `chat_message` | Chatcommands R; Discord C/U; Pokémon R; RPG R; Twitch C/U/D; Twitter C/U; YouTube C/U | `community-api` | Mehrschreiber, hoch |
| `chat_room` | Chatcommands R/U; Discord C/U; Gamecheck C; RPG R; Twitch C/U; YouTube C/U/R | `community-api` | Mehrschreiber, hoch |
| `chat_server` | Discord C/U; RPG R; Twitch C/U; YouTube C/U | `community-api` | Mehrschreiber, hoch |
| `chat_user` | Chatcommands R/U; Discord C/U; RPG R; Twitch C/U/R; YouTube C/U | `community-api` | Mehrschreiber, hoch |
| `game_check` | Gamecheck C/U/D; Gamesite R | `game-catalog-api` | klarer Kern-Owner-Kandidat |
| `game_genres` | Gamecheck D; GOG C/U; Steam C/U | `game-catalog-api` | Mehrschreiber |
| `game_link` | Epic C/U; Gamecheck D/R; GOG C/U; Steam C/U | `game-catalog-api` | Mehrschreiber |
| `game_merch` | Amazon C/U; Gamecheck D | `game-catalog-api` | Mehrschreiber |
| `game_overview` | Amazon R; Chatcommands U; Gamecheck D/R; Gamesite R; Steam C/U; Twitch U | `game-catalog-api` | Mehrschreiber |
| `import_steam_controller` | Steam C/R/U | `game-catalog-api` | eindeutiger Kandidat |
| `outgoing_messages` | Chatcommands C; Discord D; Gamecheck C/D; Pokémon C; RPG C; Twitch U/D; YouTube C/D | `community-api` | Mehrschreiber, hoch |
| `playlists` | Website R; YouTube C | `media-api` | klarer Kandidat |
| `playlists_item` | YouTube C | `media-api` | klarer Kandidat |
| `rpg_char` | RPG C/U/D/R; Website R | `rpg-api` | klarer Kandidat |
| `rpg_inventory` | RPG C/D | `rpg-api` | klarer Kandidat |
| `rpg_log` | RPG C/D/R; Website R | `rpg-api` | klarer Kandidat |
| `rpg_monster` | RPG C/D/R/U | `rpg-api` | klarer Kandidat |
| `send_tweet` | Gamecheck C; Twitter D | `publishing-api` | Mehrschreiber |
| `syth_login` | RPG R; Website C/R | `identity-api` | klarer Kandidat |
| `syth_token` | Discord U; Twitch U; Website C/R; YouTube C/U | `identity-api` | Mehrschreiber, hoch |
| `videos` | Chatcommands R; Website R; YouTube C | `media-api` | klarer Kandidat |
| `vip_member` | Chatcommands R; Website R; YouTube C/D | `identity-api` | Owner noch bestätigen |

## 4. Tabellen ohne erkannte `query()`-Operation im Service-Einstiegspunkt

`metagamerscore`, `migrations`, `migrations_lock`, `own_advertising`, `rpg_itmes`, `rpg_story`, `short_url`, `simpleyth_login`

Das bedeutet nicht, dass sie unbenutzt sind. Mögliche Ursachen: Aufrufe in importierten Hilfsmodulen, dynamische Imports, Roh-SQL, Cronjobs oder historisch liegengebliebene Tabellen. Diese Tabellen erhalten daher bewusst den Status **unklar**, bis eine zweite Analyseebene ihre Zugriffe erfasst.

## 5. Erkenntnisse aus der Implementierungsstruktur

- 22 Modulordner enthalten je eigene Kopien identischer Modelldateien. Das erhöht die Gefahr unterschiedlicher Modellstände und verdeckt Abhängigkeiten.
- Die rekursive Analyse bestätigte die wesentlichen Zugriffsgrenzen der Einstiegspunkte. Zusätzliche Datenzugriffe wurden nur in `gamesite/img_importer.js` (`game_link`, `game_overview`) sowie YouTube-Hilfsdateien (`syth_token`) gefunden; sie verschärfen die bestehende Ownership-Bewertung, eröffnen aber keine neue Tabellen-Domäne.
- `discord/app.js` verwendet `discord.js` und ist als Discord-Bot-Adapter einzustufen. Ein Selfbot wurde durch diese Analyse weiterhin nicht belegt.
- Mindestens `gamesite/app.js` sowie einzelne Migrationen enthalten `knex.raw()`; sie sind bei der PostgreSQL-Kompatibilitätsprüfung separat zu behandeln.
- Die Tabellen `migrations` und `migrations_lock` gehören in eine künftige Migrationsstrategie, sind aber keine Produktdomäne und dürfen nicht zwischen neuen Services geteilt werden.

## 6. Nächste Verifikation vor einer Owner-ADR

1. Alle `app.js`-importierten Helper/Controller rekursiv bis zum tatsächlichen Datenzugriff auflösen.
2. Für die Mehrschreiber-Tabellen die konkreten Schreiboperationen und Auslöser (Webhook, Cron, UI, Import) dokumentieren.
3. Den externen oder fehlenden Discord-Selfbot weiter lokalisieren.
4. Erst dann eine ADR für `community-api`, `identity-api` und `game-catalog-api` mit Alternativen und Empfehlung erstellen.
5. Keinen Ziel-Service implementieren und keine Tabelle migrieren, bevor die Schreiber pro Domäne bestätigt sind.
