**kw.media Stream-Tools**×**SimpleYTH**

# Live-Chat für die Stream-Tools

Für Sascha: Die sieben Stream-Tools haben schon einen Socket-Eingang. Wenn SimpleYTH dort den YouTube-Chat im Format des Twitch-Chats ausgibt, lesen alle Tools ihn so, wie sie heute Twitch lesen.

Stand **26.11.2026**, zweite Fassung Weg: **WebSocket, Twitch-IRC-Format** Keine neue REST-API nötig

Die erste Fassung dieser Seite hatte eine neue REST-API mit Polling vorgeschlagen. Die entfällt: Der Socket-Eingang steckt seit Oktober in den Tools und war genau für SimpleYTH gedacht.

Ausgangslage

## Wie die Tools heute verbinden

Die Tools laufen komplett im Browser: auf der Tool-Seite, als OBS-Browserquelle oder als heruntergeladene HTML-Datei. Sie öffnen einen WebSocket zum Twitch-Chat und lesen ihn anonym im IRC-Format. Mit dem Parameter `?irc=` verbinden sie sich stattdessen mit einem anderen Socket. Wer dort dasselbe Format spricht, wird gelesen wie Twitch. Jedes Tool nutzt andere Teile einer Chat-Zeile:

| Tool | Liest aus dem Chat | Nutzt aus der Zeile |
| --- | --- | --- |
| Tier-Liste | Stimmen wie `S` oder `!a` | `user-id` (eine Stimme pro Person), Text |
| Stream-Bingo | `!bingo` oder `bingo` | Login: Die Karte wird aus dem Namen berechnet, den Zuschauer selbst eintippen |
| Chat-Hotwords | alle Nachrichten | Login (jede Person zählt einmal pro Wort), Text |
| Glücksrad | Beitrittsbefehl, danach die nächste Nachricht des Gewinners | Login, `display-name`, Badge `subscriber` |
| Turnierbaum | `1`/`2` oder `a`/`b` | Login |
| Stream-Szenen | alle Nachrichten als Chatbox oder Laufband | `display-name`, Text, `id`, `CLEARMSG` und `CLEARCHAT` |
| Death-Counter | `!tod`, `!sieg`, `!timer start` | Badges `broadcaster` und `moderator`, `display-name` |

Protokoll

## So läuft eine Verbindung

Zeilen enden mit `\r\n`, mehrere Zeilen in einem WebSocket-Frame sind in Ordnung. Maßgeblich ist, was der Parser der Tools versteht. Mehr als diese Befehle braucht es nicht.

| Richtung | Zeile | Bedeutung |
| --- | --- | --- |
| Nach dem Verbindungsaufbau |  |  |
| Tool → | `CAP REQ :twitch.tv/tags twitch.tv/commands` | Kann SimpleYTH ignorieren. |
| Tool → | `PASS <Chat-Key>` | Der Key. Heute schicken die Tools hier den anonymen Twitch-Platzhalter `SCHMOOPIIE`. |
| Tool → | `NICK justinfan12345` | Zufallsname, kann SimpleYTH ignorieren. |
| Tool → | `JOIN #kanal` | Was der Streamer ins Kanal-Feld tippt. Kann SimpleYTH ignorieren, der Key bestimmt den Kanal. |
| Antworten von SimpleYTH |  |  |
| ← Tool | `:tmi.simpleyth ROOMSTATE #kanal` | Das Tool zeigt „Verbunden“. Muss innerhalb von 8 Sekunden kommen, sonst zeigt es „Keine Antwort“. |
| ← Tool | `@… :login!login@youtube PRIVMSG #kanal :Text` | Jede neue Chat-Nachricht, Felder siehe Punkt 02. |
| ← Tool | `@target-msg-id=<id> :tmi.simpleyth CLEARMSG #kanal :Text` | Eine Nachricht wurde gelöscht. |
| ← Tool | `:tmi.simpleyth CLEARCHAT #kanal :login` | Person gesperrt oder Timeout: Alle ihre Nachrichten verschwinden. |
| ← Tool | `:tmi.simpleyth NOTICE * :…` | Fehler und Status, siehe Punkt 05. |
| ← Tool | `PING :tmi.simpleyth` | Das Tool antwortet mit `PONG :tmi.simpleyth`. Gut gegen Verbindungen, die einschlafen. |
| ← Tool | `RECONNECT` | Optional, etwa vor einem Server-Neustart: Das Tool schließt und verbindet sich neu. |

Beispielzeilen von SimpleYTH an ein Tool

```
:tmi.simpleyth ROOMSTATE #kanal
@badges=broadcaster/1;display-name=Streamer;id=LCC.aaa111;user-id=UCaaaaaaaaaaaaaaaaaaaaaa :streamer!streamer@youtube PRIVMSG #kanal :!timer start
@badges=moderator/1,subscriber/1;display-name=Beispiel\sName;id=LCC.bbb222;user-id=UCbbbbbbbbbbbbbbbbbbbbbb :beispielname!beispielname@youtube PRIVMSG #kanal :!tod
@badges=;display-name=Zuschauerin;id=LCC.ccc333;user-id=UCcccccccccccccccccccccc :zuschauerin!zuschauerin@youtube PRIVMSG #kanal :S
@target-msg-id=LCC.ccc333 :tmi.simpleyth CLEARMSG #kanal :S
:tmi.simpleyth CLEARCHAT #kanal :zuschauerin
:tmi.simpleyth NOTICE * :Chat unavailable: stream ended
PING :tmi.simpleyth
```

Anforderungen

## Was SimpleYTH dafür können muss

1. 01

   ### Ein WebSocket, der den Twitch-Chat nachspielt

   Muss
   - Erreichbar über `wss://`, falls er auf deinem Server läuft. Die Tools hängen auch an Seiten mit https.
   - Den Ablauf oben verstehen: `PASS`, `NICK` und `JOIN` annehmen, mit `ROOMSTATE` antworten.
   - Keine CORS-Header nötig, WebSockets laufen nicht über CORS. Die Origin bitte nicht einschränken: Die heruntergeladene HTML-Datei schickt `null`.
2. 02

   ### Chat-Nachrichten als PRIVMSG mit diesen Tags

   Muss

   | Teil der Zeile | Inhalt aus YouTube | Wofür |
   | --- | --- | --- |
   | Login `:login!login@youtube` | Handle ohne `@`, klein geschrieben | eindeutige Person: eine Stimme pro Person, Bingo-Karte, Glücksrad, Bot-Filter |
   | `user-id` | Kanal-ID (`UC…`) | Tier-Liste |
   | `display-name` | Anzeigename. Leerzeichen als `\s`, kein `;` | Gewinner, Chatbox, Protokoll |
   | `badges` | `broadcaster/1` für den Owner, `moderator/1` für Mods, `subscriber/1` für Mitglieder, mehrere mit Komma | Death-Counter, Glücksrad „nur Mitglieder“ |
   | `id` | Nachrichten-ID | Löschungen zuordnen |
   | Text nach ` :` | ungekürzt und unverändert, inklusive `!`-Befehlen. Super Chats mit Text ebenfalls als PRIVMSG. | alle |
   | `color` | optional `#RRGGBB`, sonst weglassen | Namensfarbe in der Chatbox |
   | `emotes` | bitte weglassen: Das Feld erwartet Twitch-Emote-IDs | nichts |

   Mitgliedschaften, Geschenke und Super Sticker ohne Text brauchen die Tools nicht. Die können wegfallen oder als `USERNOTICE` kommen, das ignorieren die Tools.
3. 03

   ### Nur Neues, fast in Echtzeit

   Muss
   - Nach dem `JOIN` keine alte Historie schicken, sonst zählen alte Nachrichten als Stimmen oder Befehle.
   - Verzögerung möglichst höchstens 2–3 Sekunden, denn Abstimmungen und `!tod` müssen sofort im Bild sein.
4. 04

   ### Moderation weiterreichen

   Muss
   - Sperre oder Timeout (`userBannedEvent`): `CLEARCHAT` mit demselben Login wie in den PRIVMSG-Zeilen. Ohne Login löscht `CLEARCHAT` den ganzen Chat, das bitte nie schicken.
   - Einzeln gelöschte Nachricht: `CLEARMSG` mit `target-msg-id`.

   Die offizielle YouTube Data API meldet einzelne Löschungen nicht als Ereignis. Ein „tombstone“ wird laut Doku nicht beim Löschen gesendet, sondern markiert nur nachträglich die Stelle. Bekommt der Helper Löschungen nicht mit, bleibt eine von Mods gelöschte Nachricht im Overlay stehen. Auf Twitch verschwindet sie.
5. 05

   ### Fehler und Status per NOTICE

   Muss

   Die Tools zeigen eine NOTICE als Fehlermeldung an, aber nur, wenn ihr Text eines dieser Wörter enthält: `fail`, `invalid`, `banned`, `suspend` oder `unavailable`. Angezeigt werden die ersten 90 Zeichen, wörtlich. Vorschlag:

   | Fall | NOTICE-Text |
   | --- | --- |
   | Key falsch oder ohne Chat-Recht | `Login authentication failed` |
   | Gerade kein Livestream | `Chat unavailable: no live stream` |
   | Chat der Übertragung ist aus | `Chat unavailable: chat is disabled` |
   | Livestream ist vorbei | `Chat unavailable: stream ended` |

   Den Socket danach bitte offen lassen. Schließt er, verbindet das Tool sofort neu, und die Meldung verschwindet wieder. Beginnt später ein Livestream, reicht ein neues `ROOMSTATE`: Das Tool springt auf „Verbunden“. So kann eine OBS-Quelle dauerhaft eingerichtet bleiben.
6. 06

   ### Eigener Key nur zum Chat-Lesen

   Muss

   Der Key liegt beim Streamer im Browser-Speicher oder in der OBS-Quelle. Ein Key, der auch `/me`, `/members` und Analytics lesen darf, wäre dort zu riskant. Darum bitte einen Key, der nur den Live-Chat lesen darf und sich einzeln widerrufen lässt. Er kommt als `PASS`-Zeile im Socket, nicht in die Adresse.
7. 07

   ### Ein YouTube-Abruf für alle

   Muss

   Ein Streamer hat oft 3–4 Tools gleichzeitig offen, also 3–4 Sockets. Die dürfen nicht je einen eigenen YouTube-Abruf auslösen. Der Helper sollte den Chat einmal lesen und an alle Sockets verteilen. Am besten über `liveChatMessages.streamList`, also eine offene Verbindung statt Dauer-Polling. Google empfiehlt das selbst, um das Kontingent zu schonen.

   10.000 Einheiten/Tag÷ 5 je Abruf= **2.000 Abrufe**alle 5 s = 720/h→ **≈ 2,8 h Stream pro Tag**

   0 hReicht ≈ 2,8 von 24 h, für alle Kanäle eines Google-Projekts zusammen24 h
8. 08

   ### Mehrere Sockets pro Key

   Sollte

   3–4 Tools und das Stream-Fenster gleichzeitig, alle mit demselben Key.
9. 09

   ### Mehrere laufende Übertragungen

   Sollte

   Zum Beispiel ein Test- und ein echter Stream gleichzeitig: Nachrichten aus beiden liefern. Die Tools unterscheiden das nicht, aber es sollte keiner der beiden Chats fehlen.
10. 10

    ### Kanal-Emojis als Bild

    Später

    YouTube liefert eigene Emojis nur als Text, zum Beispiel `:_DefEhre:`. So erscheinen sie vorerst auch in der Chatbox. Als Bild bräuchte es eine Liste „Kürzel → Bild-URL“ und auf unserer Seite einen Umbau, denn das `emotes`-Feld kennt nur Twitch.
11. 11

    ### In den Chat schreiben

    Später

    Zum Beispiel „Bingo von @x bestätigt“ oder der Glücksrad-Gewinner. Die Tools schreiben heute nichts. Falls es kommt, dann nur mit einem eigenen Schreib-Recht und nie mit dem Lese-Key im Browser. Kostet bei YouTube 20 Einheiten pro Nachricht.

Unsere Seite

## Was wir in den Tools anpassen

1. `?irc=` nimmt heute nur `ws://localhost` und `127.0.0.1` an. Läuft der Socket auf deinem Server, nehmen wir dessen Adresse dazu, nur mit `wss://`.
2. Ein Feld für den Chat-Key. Das Tool schickt ihn als `PASS` statt `SCHMOOPIIE`.
3. Texte von „Twitch“ auf „Twitch oder YouTube“ ändern und `simpleyth` auf die Bot-Ignorierliste setzen, damit dein Bot nicht mitzählt.

Läuft der Socket dagegen lokal beim Streamer (`ws://localhost:PORT`), sollte es ohne Umbau gehen, dann eben ohne Key. Das würden wir einmal zusammen testen.

Bestehende Endpunkte

## Brauchen die Tools nicht

`/me``/channels``/members``/videos``/playlists``/analytics/*``/rpg/characters`

Für den Chat ist kein REST-Endpunkt nötig, alles läuft über den Socket.

Offen

## Fragen an Sascha

1. Hast du vom Socket schon etwas gebaut? Dann richten wir uns nach deinem Stand.
2. Läuft der Socket auf deinem Server (unter welcher Adresse?) oder lokal beim Streamer?
3. Wie liest der Helper den Chat: über die offizielle Data API (welches Google-Projekt, wie viel Kontingent?) oder anders?
4. Bekommt er einzeln gelöschte Nachrichten mit?

Quellen

## Geprüft am 26.11.2026

- Twitch-Chat über IRC, Tags, ROOMSTATE, CLEARMSG, CLEARCHAT: [dev.twitch.tv/docs/chat/irc](https://dev.twitch.tv/docs/chat/irc/)
- Kontingent (list 5, streamList 5, insert 20; 10.000 Einheiten pro Tag): [developers.google.com/youtube/v3/determine_quota_cost](https://developers.google.com/youtube/v3/determine_quota_cost)
- Nachrichtentypen, authorDetails, tombstone: [developers.google.com/youtube/v3/live/docs/liveChatMessages](https://developers.google.com/youtube/v3/live/docs/liveChatMessages)
- streamList: [developers.google.com/youtube/v3/live/docs/liveChatMessages/streamList](https://developers.google.com/youtube/v3/live/docs/liveChatMessages/streamList)
- Das Zeilenformat oben folgt dem Chat-Parser der Tools (`kit/core.js`, `tier-list.js`, `stream-bingo.js`).

kw.media · Socket-Anschluss der Stream-Tools an SimpleYTH