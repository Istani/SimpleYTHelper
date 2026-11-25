# Chatbot-Marktvergleich: Twitch, YouTube und SimpleYTH

**Stand:** 25. November 2026  
**Zweck:** Festhalten, welche Funktionen verbreitete Twitch-/YouTube-Chatbots anbieten, was im bestehenden SimpleYTH-Legacy-System bereits vorhanden ist und welche Produktlücken priorisiert geschlossen werden sollten.

---

## Kurzfazit

SimpleYTH besitzt bereits die technische Grundlage eines plattformübergreifenden Community-Systems: Twitch- und YouTube-Chat werden eingelesen, zentral gespeichert und Antworten werden über eine gemeinsame Outgoing-Queue an die jeweilige Plattform zurückgegeben. Dazu kommen Website, Discord-Anbindung und RPG-Bausteine.

Die marktübliche Chatbot-Kernschicht fehlt jedoch weitgehend: **datengetriebene Commands, Berechtigungen, Cooldowns, Auto-Moderation und Auditierbarkeit**. Ohne diese Grundlagen bleiben vorhandene Commands fest im Code eingebaut und können nicht sicher durch Channel-Owner konfiguriert werden.

**Empfohlene Priorität:** Erst die konfigurierbare Command-/Moderationsbasis schaffen; danach Engagement-Funktionen wie Timer, Quotes, Counter, Giveaways und Loyalty/RPG ausbauen.

---

## Vergleich der betrachteten Bots

| Bot | Plattformfokus | Stärken | Für SimpleYTH relevante Muster |
|---|---|---|---|
| **Nightbot** | Twitch, YouTube und weitere Plattformen | Schlanke, cloudbasierte Command- und Moderationsbasis | Custom Commands, Rollen, Cooldowns, Timer, Variablen, Action Logging, Manager-Rolle |
| **StreamElements** | Twitch, YouTube, Kick | Breites Community- und Moderationspaket | Commands, Timer, Spamfilter, Benutzerlevel, Counter, Queue, Loyalty-Store, Leaderboard, Giveaways, Minigames |
| **Streamlabs Cloudbot** | Twitch, YouTube, Kick | Integration mit Streamlabs-Widgets und Engagement-Modulen | Filter, Punkte, Polls, Giveaways, Quotes, Queue, Media Share, Minigames, Chat-Alerts |
| **Moobot** | Twitch | Fein steuerbare Twitch-Automation | AutoMod, Command-Aliase, Auto-Posts, Song Requests, Polls, Giveaways, Teamrechte, Shoutouts, temporäre VIPs |
| **BotRix** | Twitch, YouTube, Discord, Kick, Trovo u. a. | Multiplattform-Ansatz und Loyalty | Commands mit Variablen, Timers, Antispam, Punkte/Level/Watchtime, Store, API, Cross-Platform-Community |

### Einordnung

- **Nightbot** zeigt den sinnvollen Mindeststandard: Commands, Rechte, Cooldowns, Timer und nachvollziehbare Aktionen.
- **StreamElements** und **Streamlabs** zeigen, welche Engagement-Module nach der Kernschicht sinnvoll werden.
- **Moobot** zeigt, wie wichtig detaillierte Mod-Delegation und Twitch-spezifische Automation sind.
- **BotRix** ist der passendste Vergleich für SimpleYTHs langfristige Chance: eine gemeinsame Community über mehrere Plattformen statt ein separater Bot je Plattform.

---

## Marktstandard nach Funktionsbereich

| Funktionsbereich | Typische Funktionen bei Vergleichsbots | Beispiele |
|---|---|---|
| Custom Commands | Erstellen, bearbeiten, deaktivieren, löschen; Aliase; Antwortvariablen; Ausführung aus Chat oder Dashboard | Nightbot, StreamElements, Streamlabs, BotRix |
| Permissions | Viewer, Regular, Subscriber/Member, VIP, Moderator, Super-Mod, Owner/Manager | StreamElements, Moobot, Nightbot |
| Cooldowns | Command-weiter und pro Nutzer gesetzter Cooldown | Nightbot, StreamElements, BotRix |
| Auto-Moderation | Caps-, Link-, Emote-, Symbol-, Wiederholungs- und Wortfilter; Ausnahmen und Maßnahmen | Streamlabs, StreamElements, Moobot |
| Timer | Zeitgesteuerte Hinweise, oft nur bei Live-Status und hinreichender Chat-Aktivität | Nightbot, StreamElements, Moobot |
| Moderationswerkzeuge | Permit/Linkfreigabe, Mass-Timeouts, Regeln, Mod-Delegation, Nutzerverwaltung | StreamElements, Streamlabs, Moobot |
| Engagement | Quotes, Counter, Polls, Giveaways/Raffles, Viewer Queue, Minigames | Streamlabs, StreamElements, Moobot |
| Loyalty | Watchtime, Punkte, Level, Leaderboard, Shop und Reward-Redemption | StreamElements, Streamlabs, BotRix |
| Stream-Steuerung | Titel, Kategorie, Tags, Marker, Shoutouts, Ads, Alerts | Nightbot, StreamElements, Moobot |
| Observability | Command-Nutzung, Moderationsereignisse, Änderungs- und Action-Logs | Nightbot |
| Multiplattform | Gemeinsame Commands, Daten oder Community-Funktionen über mehrere Plattformen | Streamlabs, StreamElements, BotRix |

---

## Plattformgrenzen bei YouTube

Nicht jedes Twitch-Feature lässt sich auf YouTube identisch anbieten. StreamElements dokumentiert beispielsweise für YouTube, dass dessen Loyalty-System und darauf aufbauende Features wie Giveaways, Stream Store, Viewer Queue und Media Requests dort nicht verfügbar sind.

Für SimpleYTH folgt daraus:

1. Features immer mit einem klaren Plattform-Scope modellieren.
2. Nicht automatisch annehmen, dass Twitch-Rollen oder Events ein YouTube-Gegenstück besitzen.
3. Gemeinsame Community-Funktionen nur bewusst und transparent über eine eigene SimpleYTH-Identitäts- bzw. Reward-Schicht umsetzen.
4. Twitch-/YouTube-native Moderationsfunktionen ergänzen, nicht verdrängen.

---

## Verifizierter SimpleYTH-Ist-Stand

Die folgenden Punkte wurden am Live-Checkout `defender833:/root/SimpleYTHelper` untersucht.

### Vorhandene Basis

- **Chat-Ingest:** `twitch/app.js` und `youtube/app.js` speichern eingehende Nachrichten zentral in `chat_message`.
- **Plattformübergreifende Command-Verarbeitung:** `chatcommands/app.js` verarbeitet die zentrale Message-Queue.
- **Antwortqueue:** Antworten werden in `outgoing_messages` abgelegt; die jeweiligen Plattform-Connectoren übernehmen das Senden.
- **Feste Commands:** Im aktuellen Worker existieren unter anderem `!commands`, `!help`, `!party`, `!peel`, `!gege`, `!game`, `!sombrero` und `!discord`; weitere Commands betreffen interne RPG-/Quest-/Announcement-Abläufe.
- **Live-Chatfeed:** Socket.IO überträgt neue Chatnachrichten an angemeldete Clients.
- **Twitch-/YouTube-Domainlogik:** Twitch-Streams/Channels und YouTube-Livechats werden bereits verarbeitet.
- **RPG:** Bestehende RPG-Logik kann später als Alleinstellungsmerkmal mit Community-Engagement verbunden werden.

### Bestehende Einschränkungen

- Commands sind als JavaScript-Array in `chatcommands/app.js` hardcodiert; es gibt keine allgemein administrierbare Command-Ablage.
- Der Dispatcher verwendet für die Suche `startsWith(element.name)`. Das ist für frei definierbare Commands ungeeignet, da sich Präfixe überschneiden können.
- Eine generische Berechtigungsprüfung vor Command-Ausführung ist nicht sichtbar.
- Bei der Announcement-Funktion steht sogar explizit `// ToDo: User Filter`.
- Keine allgemein konfigurierbare Auto-Moderation, kein generischer Timer, kein Loyalty-System, keine Giveaways/Polls/Viewer-Queue und kein systematisches Bot-Audit wurden in der untersuchten Command-Schicht festgestellt.
- `chatcommands/package.json` enthält kein Test-Script; für neue Command-Logik sind fokussierte Tests nötig.

---

# Priorisierte Lücken und Empfehlungen

## Priorität 1: Die Bot-Plattformbasis

### 1. Datengetriebene Custom Commands

**Was fehlt:** Channel-Owner und Moderation können Commands nicht selbst sicher konfigurieren. Änderungen erfordern derzeit Codeänderungen.

**Zielbild:** Commands werden pro Channel und Plattform als Daten gespeichert und können im Dashboard verwaltet werden.

**MVP-Eigenschaften:**

- Name, Antwort, Aktivstatus, Sichtbarkeit
- Scope `(service, server)` für Plattform und Channel
- exaktes Token-Matching statt Präfix-Matching
- Antwortvariablen, z. B. Sender, Channel, Query und Counter
- Rollenvorgabe und Cooldowns
- Legacy-Commands behalten zunächst Vorrang, damit keine bestehende Funktion unbemerkt ihr Verhalten ändert

**Warum zuerst:** Diese Fähigkeit ersetzt Hardcoding durch Konfiguration und ist Voraussetzung für nahezu alle weiteren Bot-Funktionen.

### 2. Rollen, Berechtigungen und Cooldowns

**Was fehlt:** Eine zentrale, vor der Command-Ausführung angewandte Permission-/Cooldown-Schicht.

**Benötigt:**

- nachvollziehbare Rollen mindestens für Viewer, Moderator und Owner
- später: Regular, Twitch-VIP, Subscriber und YouTube-Member nach belastbarer Metadatenprüfung
- pro Command ein Mindestlevel
- optional User-Allowlist bzw. Blocklist
- globaler und pro Nutzer geltender Cooldown
- fail-closed: unklare Rollen oder unklarer Channel führen nicht zu einer Freigabe

### 3. Konfigurierbare Auto-Moderation

**Was fehlt:** Channelbezogene Regeln gegen Spam und Missbrauch.

**Mindestumfang:**

- Link-Policy mit temporärer Freigabe (`permit`) und Domain-Allowlist
- Caps-, Emote-, Symbol-, Wiederholungs- und Nachrichtenfrequenzfilter
- Wort-/Phrasenlisten mit Ausnahmen
- abgestufte Maßnahmen: Hinweis, Timeout, Eskalation
- nachvollziehbarer Moderationslog

**Leitlinie:** Plattformmechanismen wie Twitch AutoMod, Timeout und Ban bleiben die Vollzugsebene; SimpleYTH ergänzt sie mit einheitlicher Konfiguration und Auditierbarkeit.

### 4. Audit-Log und Observability

**Was fehlt:** Ein systematisches, auswertbares Protokoll für Bot-Aktionen.

**Empfohlenes Ereignismodell:**

- Command ausgeführt
- Command wegen Rolle abgelehnt
- Command wegen Cooldown abgelehnt
- Moderationsregel ausgelöst
- Command/Regel erstellt, verändert, deaktiviert oder gelöscht
- technische Fehler ohne Geheimnisse im Event-Payload

**Nutzen:** Debugging, Missbrauchsanalyse, Dashboard-Statistiken und sichere Delegation an Mods.

---

## Priorität 2: Community-Funktionen auf der Basis

### 5. Timer mit Aktivitätsbedingungen

Geplante Hinweise für Discord, Streamplan, Regeln oder Sponsoren. Timer sollten nur bei aktivem Stream und ausreichender Chat-Aktivität laufen, rotieren und ein globales Rate Limit einhalten.

### 6. Quotes, Counter und Shoutouts

Schnell sichtbare, kleine Module:

- **Quotes:** zufällig oder per ID; Änderung nur durch berechtigte Rollen.
- **Counter:** etwa `!wins` und `!deaths`; Veränderung nur durch berechtigte Rollen.
- **Shoutouts:** manuell oder optional ereignisgesteuert, immer mit Cooldown und Opt-out.

### 7. Giveaways, Polls und Viewer Queue

- Giveaway-Lifecycle: öffnen, teilnehmen, schließen, Gewinner ziehen und Audit.
- Polls mit Optionen, Laufzeit und Ergebnissen.
- Queue für Community-Games, Gastslots oder Interaktionen.

**Sicherheitsanforderungen:** eindeutige Teilnahme, Sperrlisten, nachvollziehbare Gewinnerziehung und keine unklare Pay-to-win-Mechanik.

---

## Priorität 3: Differenzierung über SimpleYTH

### 8. Loyalty in Verbindung mit dem RPG

Das vorhandene RPG kann SimpleYTH von generischen Bots abheben:

- XP/Punkte für Watchtime und qualifizierte Chat-Aktivität
- Leaderboards pro Channel
- kosmetische und spielerische RPG-Rewards
- Daily-/Weekly-Quests
- kanalindividuelle Reward-Definitionen
- Anti-Farming- und Missbrauchsschutz

Das sollte keine voreilige gemeinsame Punktewirtschaft für Twitch und YouTube werden. Plattformübergreifende Identität, Einwilligung und Abuse-Prevention sind dafür Voraussetzungen.

### 9. Plattformübergreifendes Community-Dashboard

Langfristiges Differenzierungsziel:

- gemeinsame Sicht auf Twitch, YouTube und Discord
- Channel-/Plattformfilter für Chat-, Command- und Moderationsdaten
- Streamplan, Videos, Playlists, RPG und Chat in einem System
- explizit konfigurierbare, plattformübergreifende Events statt verdeckter Datenteilung

### 10. Streamer-Steuerung aus dem Chat

Nach der Rechte- und Auditbasis:

- Titel, Kategorie und Tags
- Streammarker
- geplante Announcements
- Overlay-Ereignisse
- Clip-/Highlight-Workflow
- Song-/Media-Requests mit Queue, Blacklist, Längenlimit und Freigabeprozess

---

## Empfohlene Umsetzungsreihenfolge

1. **Datengetriebene Custom Commands**
2. **Permissions, Rollen, Cooldowns und Audit-Log**
3. **Auto-Moderation**
4. **Timer, Quotes, Counter und Shoutouts**
5. **Giveaways, Polls und Viewer Queue**
6. **Loyalty-/RPG-Verknüpfung**
7. **Cross-Platform-Analytics und Streamer-Automation**

---

## Produktentscheidung für den ersten Custom-Command-Wurf

Die erste Version soll klein und sicher bleiben:

- Verwaltung nur im Website-Dashboard durch Channel-Owner bzw. Website-Admins
- Chat-Mods dürfen die freigegebenen Commands ausführen, aber nicht direkt im Chat beliebig erstellen oder ändern
- sichere Platzhalter statt Script-Ausführung
- Commands immer mindestens an Plattform und Channel gebunden
- exaktes Matching, Längenlimits, Cooldowns und Audit ab der ersten Version

Dadurch entsteht keine Ansammlung von Spezialbefehlen, sondern eine belastbare Grundlage, auf der spätere Bot- und RPG-Funktionen wartbar aufgebaut werden können.

---

## Beschlossene Leitlinien für Custom Commands (25. November 2026)

Die folgenden Punkte wurden nach der ersten Vergleichs- und Architekturabstimmung festgelegt.

| Thema | Beschluss |
|---|---|
| Command-Matching | Erster Token nach dem Prefix, case-insensitive und exakt. Kein `startsWith`-Matching. |
| Command-Scope | Ein Command gehört zu einem **Syth-User**, nicht zu einem einzelnen Twitch-/YouTube-Channel. Der Worker ermittelt über `(service, server)` den verknüpften `channel.user_id` und lädt dessen Commands. Damit gilt ein Command auf allen mit diesem User verknüpften Plattformen. |
| Globale Commands | Admin-definierte Commands gelten in jeder Bot-Instanz. Sie werden zusätzlich zu User-Commands geladen und sind nicht an einen Channel gebunden. |
| Bestehende Commands | Die aktuell hardcodierten Commands werden als globale Datenbank-Commands migriert und danach aus dem Command-Array entfernt. Speziallogik, die keine reine Textantwort ist, benötigt dabei einen expliziten, sicheren Command-Typ statt frei ausführbaren Code. |
| Vorlagen/Sicherheit | Keine Ausführung von JavaScript, Shell-Befehlen, HTTP-Requests, frei formulierbaren Datenbankabfragen oder sonstigem Code. Vorlagen dürfen nur feste, serverseitig implementierte Platzhalter verwenden; deren Daten stammen aus definierten Datenbank- bzw. Chat-Kontextfeldern. |
| Dashboard-Verwaltung | Nur Channel-Owner bzw. Website-Admins verwalten Commands im Website-Dashboard. Keine Command-Verwaltung durch Moderatoren im Chat. |
| Berechtigungen | MVP trennt mindestens `owner` und `everyone`. Eine generische `moderator`-Rolle wird zunächst nicht als Command-Verwaltungsrecht eingeführt, da die Rollen zwischen Twitch, YouTube und Discord nicht einheitlich abbildbar sind. |
| Cooldowns | Das Schema und die Ausführungslogik werden von Beginn an vorbereitet. Alle anfänglichen Werte sind `0`, also ohne aktive Begrenzung. |

### Konsequenz für das Datenmodell

Die frühere Empfehlung `(service, server, name)` als eindeutiger Command-Scope ist durch den Beschluss ersetzt. Vorgeschlagene Trennung:

- **Globaler Command:** `owner_id = NULL`, nur durch Website-Admins verwaltbar.
- **User-Command:** `owner_id = syth_login.id`, gilt automatisch für alle aktuell und künftig diesem Syth-User zugeordneten Channels.
- **Channel-Zuordnung zur Laufzeit:** Eingehende `chat_message.service` und `chat_message.server` werden gegen `channel.service` und `channel.channel_id` aufgelöst; darüber wird `channel.user_id` ermittelt.
- **Eindeutigkeit:** `(owner_id, name)`. Ein global reservierter Name darf nicht zusätzlich als User-Command angelegt werden, damit globale Commands tatsächlich in jeder Instanz verfügbar bleiben.

### Vorgeschlagene Command-Typen für die Migration

Nicht jeder bisherige Hardcode ist eine reine Textantwort. Deshalb erhalten globale Commands einen festen, geprüften Typ statt einer im Datensatz gespeicherten Funktion:

| Typ | Beispiel | Verhalten |
|---|---|---|
| `template` | `discord`, `gege` | Rendert ausschließlich eine sichere Textvorlage. |
| `system_action` | `game`, `announcement`, `quest` | Ruft eine fest im Servercode registrierte und getestete Aktion per stabilem Schlüssel auf. Der Datensatz kann keinen beliebigen Funktionsnamen oder Code enthalten. |
| `command_list` | `commands`, `help` | Ermittelt sichtbare globale und eigene Commands und erzeugt daraus eine begrenzte Antwort. |

Damit können die JavaScript-Definitionen aus dem Command-Array entfernt werden, ohne die Logik in unsichere Datenbankinhalte zu verlagern.

## Quellen

Die Funktionsvergleiche basieren auf den offiziellen Produkt-/Dokumentationsseiten:

- Nightbot – Commands: <https://docs.nightbot.tv/control-panel/commands>
- Nightbot – Produktübersicht: <https://nightbot.tv/>
- StreamElements – Chatbot-Funktionen: <https://streamelements.com/features/chatbot>
- StreamElements – YouTube-Chatbot und Plattformgrenzen: <https://docs.streamelements.com/selive/guides/youtube-quickstart/set-up-your-chatbot>
- StreamElements – Bot-Plattformen: <https://docs.streamelements.com/chatbot/platforms>
- Streamlabs Cloudbot: <https://streamlabs.com/cloudbot>
- Streamlabs – Commands für Twitch/YouTube: <https://support.streamlabs.com/hc/en-us/articles/4413183935131-How-to-Add-Chat-Commands-for-Twitch-and-YouTube>
- Moobot – Dokumentationsübersicht: <https://moo.bot/docs>
- BotRix – Dokumentation: <https://botrix.live/docs>
