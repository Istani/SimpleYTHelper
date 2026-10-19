# SYTH Chat-Socket

`chatcommands/app.js` beantwortet Chat-Befehle und stellt auf Port 3005 einen socket.io-Server (Version 2) bereit. Darüber hängen sich Overlays (games-on-sale.de) und das kw.media Stream-Toolkit an den Chat.

## Verbinden

```js
const socket = io("wss://DEIN-SERVER:3005");
socket.send("join", "UC...");        // YouTube-Kanal-ID (bei Discord die Server-ID)
socket.on("chat", msg => {});        // jede neue Chat-Nachricht
socket.on("log", msg => {});         // Befehle + die letzten 15 Nachrichten direkt nach dem Join
socket.on("command", name => {});    // ausgeführter Befehl
socket.on("sound", name => {});      // Sound-Trigger, z. B. "palim"
```

Ohne socket.io-Bibliothek, z. B. aus einer einzelnen HTML-Datei: WebSocket auf `wss://HOST:3005/socket.io/?EIO=3&transport=websocket` öffnen, danach `42["message","join","UC..."]` senden und alle 25 s ein Ping (`2`) schicken. Nachrichten kommen als `42["chat",{...}]`.

## Felder von `chat`

Gleicher Aufbau wie `log`: `service`, `server`, `room`, `id`, `user`, `user_name`, `content`, `timestamp`, `created_at` (HH:mm) – zusätzlich `profile_picture`. Ältere Nachrichten liefert der Feed nicht nach, nur was ab dem Start neu reinkommt.

## Einstellungen (.env)

Alles optional – ohne Einträge verhält sich der Server wie bisher.

| Eintrag | Bedeutung | Standard |
| --- | --- | --- |
| `CHAT_SOCKET_PORT` | Port | `3005` |
| `CHAT_SOCKET_ORIGINS` | erlaubte Seiten, kommagetrennt, `*` = alle | `http://games-on-sale.de:3000` |
| `CHAT_SOCKET_ALLOW_FILE` | `1` = auch lokal geöffnete Dateien und OBS-Browserquellen (Origin `null`) | aus |
| `CHAT_SOCKET_TLS_KEY` / `CHAT_SOCKET_TLS_CERT` | Pfade zu Schlüssel und Zertifikat, beide gesetzt = `wss://` | aus |
| `CHAT_FEED` | `0` = Event `chat` abschalten | an |
| `CHAT_FEED_INTERVAL_MS` | wie oft der Feed in die DB schaut | `1000` |
| `YOUTUBE_LIVECHAT_DELAY_MS` | Abstand zwischen zwei Live-Chat-Abfragen (youtube/app.js) | `30000` |
| `YOUTUBE_LIVECHAT_MSG_SLEEP_MS` | Pause pro importierter Nachricht (youtube/app.js) | `1000` |

Beispiel für das Stream-Toolkit:

```
CHAT_SOCKET_ORIGINS=http://games-on-sale.de:3000,https://kw.media
CHAT_SOCKET_ALLOW_FILE=1
CHAT_SOCKET_TLS_KEY=/etc/letsencrypt/live/DEIN-SERVER/privkey.pem
CHAT_SOCKET_TLS_CERT=/etc/letsencrypt/live/DEIN-SERVER/fullchain.pem
```

Seiten, die per https laufen, dürfen nur `wss://` öffnen – deshalb TLS. Statt Zertifikat im Bot geht auch ein Reverse Proxy (z. B. nginx mit Let's Encrypt) vor Port 3005:

```nginx
location /socket.io/ {
  proxy_pass http://127.0.0.1:3005;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
}
```

## Wie schnell kommt der YouTube-Chat an?

youtube/app.js fragt den Live-Chat standardmäßig alle 30 s ab und legt pro Nachricht 1 s Pause ein. Für Befehle reicht das, für Live-Abstimmungen ist es träge. Mit z. B. `YOUTUBE_LIVECHAT_DELAY_MS=5000` und `YOUTUBE_LIVECHAT_MSG_SLEEP_MS=0` geht es deutlich schneller – jede Abfrage kostet aber API-Kontingent. Den von YouTube vorgegebenen Mindestabstand (`pollingIntervalMillis`) unterschreitet der Bot nie.
