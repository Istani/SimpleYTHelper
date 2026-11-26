# Live-Chat API für kw.media Stream-Tools

Diese Schnittstelle versorgt die browserbasierten Stream-Tools von kw.media mit Livechat-Ereignissen aus SimpleYTH. Sie ist absichtlich eine Read-API über den bereits vorhandenen SimpleYTH-Ingest: Weder ein Browser-Abruf noch ein API-Polling löst unmittelbar einen YouTube- oder Twitch-Abruf aus.

## Entscheidungen für die erste Version

- **Plattformübergreifend:** YouTube und Twitch werden gemeinsam geliefert. Jedes Event trägt `service`, `channelId` und `roomId`.
- **Polling statt Push:** Es gibt kein WebSocket und kein SSE. Clients pollen über einen Cursor; `pollAfterMs` gibt den empfohlenen Abstand an.
- **API-Key wie bisher:** Es gibt zunächst keinen zusätzlichen API-Key-Scope und kein API-seitiges Rate-Limit. Der Key wird ausschließlich im HTTP-Header gesendet. Eine Scope- und Limit-Erweiterung bleibt kompatibel nachrüstbar.
- **Kein zusätzlicher Provider-Traffic:** Der YouTube-gRPC-Stream bzw. der Twitch-Ingest schreibt Ereignisse in `live_chat_event`. Die API liest nur diese Tabelle.
- **Start ab jetzt:** Ohne `after` liefert `/live/chat` keine Historie und gibt nur den aktuellen Cursor zurück. Das verhindert alte Votes und Commands beim Tool-Start.
- **Kanalfilter optional:** Ohne `channelId` werden Ereignisse aller dem API-Key-Owner zugeordneten YouTube- und Twitch-Kanäle zurückgegeben. `channelId` begrenzt auf einen eigenen Kanal.

## Endpunkte

### `GET /api/v1/live/status`

Liefert den bekannten Kanalbestand und den aktuell aus den Broadcast-Daten ableitbaren Live-Status.

```json
{
  "data": [
    {
      "service": "youtube",
      "channelId": "UC…",
      "channelTitle": "Beispielkanal",
      "live": true,
      "chatOpen": true,
      "broadcast": {
        "id": "VIDEO_ID",
        "title": "Live",
        "roomId": "LIVE_CHAT_ID",
        "startedAt": "2026-11-26T19:00:00Z"
      }
    }
  ],
  "meta": { "requestedUserId": 123 }
}
```

Bei Twitch wird der Live-Status in dieser ersten Version nicht aus dem Chat-Ingest abgeleitet. Für diese Kanäle bleiben `live`, `chatOpen` und `broadcast` entsprechend `false`, `null` und `null`, bis ein belastbarer Twitch-Broadcast-Status persistiert wird.

### `GET /api/v1/live/chat?after=c_42&channelId=<optional>`

Liefert nur Ereignisse nach dem Cursor. Ein Cursor ist undurchsichtig und muss unverändert zurückgesendet werden.

```json
{
  "data": [
    {
      "id": "LCC.abc123",
      "type": "textMessageEvent",
      "publishedAt": "2026-11-26T19:04:12.381Z",
      "service": "youtube",
      "channelId": "UC…",
      "roomId": "LIVE_CHAT_ID",
      "author": {
        "id": "UCzuschauer…",
        "handle": "@beispielname",
        "displayName": "Beispielname",
        "isOwner": false,
        "isModerator": false,
        "isMember": true
      },
      "text": "!tod",
      "details": null
    }
  ],
  "meta": {
    "requestedUserId": 123,
    "nextCursor": "c_43",
    "pollAfterMs": 1500,
    "hasMore": false
  }
}
```

Der Datenpuffer enthält maximal 200 Events pro Antwort. Bei `hasMore: true` muss der Client unmittelbar mit `nextCursor` weiter abrufen.

## CORS und Authentifizierung

Die API erlaubt browserbasierte Nutzung, einschließlich heruntergeladener HTML-Dateien mit Origin `null`:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: X-SYTH-API-Key, Authorization, Content-Type`
- `OPTIONS` wird ohne API-Key mit `204` beantwortet.

Der Key steht in `X-SYTH-API-Key` oder als Bearer-Token im `Authorization`-Header. Er darf nicht in URLs, Query-Parametern oder Logs erscheinen.

## Ereignisdaten und Grenzen

`live_chat_event` ist vom historischen `chat_message` getrennt. Der neue Puffer speichert einen monotonen Cursor, Plattform, Kanal, Chatraum, Quell-ID, Zeit, Autor-Snapshot, Text und provider-spezifische Details. Dadurch bleiben die bestehenden Chatcommands unverändert und die API kann beide Plattformen konsistent darstellen.

YouTube liefert über `liveChatMessages.streamList` unter anderem Text, Super Chats, Super Sticker, Mitgliedschafts-Events, Ban-/Timeout-Ereignisse und Chat-Ende. Einzelne Löschungen sind bei YouTube nicht zuverlässig in Echtzeit verfügbar: Ein `tombstone` wird laut YouTube nicht beim Löschen gesendet und enthält nicht zwingend die ursprüngliche Nachrichten-ID. Die erste Version verspricht daher keine Twitch-äquivalente `messageDeleted`-Garantie.

Twitch schreibt derzeit Textnachrichten in den neuen Puffer. Rollen, Handle und Moderation können nachgerüstet werden, sobald sie vom eingesetzten Twitch-Client zuverlässig und dauerhaft bereitgestellt werden.

## Sicherheit und spätere Ausbaustufen

Die erste Version übernimmt bewusst die bestehende API-Key-Berechtigung. Da ein Key in OBS-Browserquellen oder Browser-Speicher liegen kann, sollen vor einer breiteren Freigabe folgende Erweiterungen bewertet werden:

1. separater `chat:read`-Scope und einzeln widerrufbarer Tool-Key,
2. Rate-Limit und parallele-Verbindungen-Limit pro Key,
3. Retention/abgelaufene-Cursor-Vertrag,
4. SSE oder WebSocket mit kurzlebigem Einmal-Ticket,
5. `chat:write` nur serverseitig und mit getrenntem Scope.
