# YouTube Socket.IO API

`SYTH-YouTube` now hosts both the YouTube worker and its Socket.IO API. The former standalone `SYTH-YT-API` process is no longer used.

## Connection and security

- **Endpoint:** `http(s)://<host>:3006`
- **Protocol:** Socket.IO, not REST
- **Server:** `SYTH-YouTube` (`youtube/app.js`)
- **Authentication:** Google OAuth2; each socket has its own in-memory OAuth client.

The server has no separate application-level Socket.IO authentication. Do not expose port 3006 directly to the public Internet. Use the trusted SimpleYTH reverse proxy/network and only connect trusted clients. Never expose OAuth client secrets or serialized OAuth tokens to untrusted browser code.

## Client setup

```bash
npm install socket.io-client
```

```js
const { io } = require("socket.io-client");
const socket = io("https://<host>:3006");

socket.on("connect", () => console.log("connected", socket.id));
socket.on("API Error", (...args) => console.error("YouTube API error", args));
socket.on("TOKEN Error", (...args) => console.error("OAuth error", args));
```

## OAuth flow

1. Emit `New`.
2. Receive `Link` and send the user to the included Google authorization URL.
3. Receive the Google `code` at the configured redirect URI.
4. Emit `Code` with that code.
5. Receive `TOKEN` and `channels`.

```js
socket.on("Link", url => {
  // Redirect the user. Do not log or persist browser-side tokens.
  window.location.assign(url);
});

socket.on("TOKEN", credentials => {
  // `credentials.name` contains the selected YouTube channel ID.
  console.log("OAuth succeeded for", credentials.name);
});

socket.on("channels", channels => console.log(channels));

socket.emit("New");
// In the redirect handler after receiving ?code=...:
socket.emit("Code", authorizationCode);
```

For a trusted server-side client with existing serialized credentials:

```js
socket.emit("Auth", JSON.stringify(credentials));
```

`New` and `Auth` can receive a custom OAuth config (`clientId`, `clientSecret`, `redirectUrl`) for trusted administrative clients only:

```js
const cfg = {
  clientId: "...",
  clientSecret: "...",
  redirectUrl: "https://trusted.example/youtube/callback"
};

socket.emit("New", cfg, [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly"
]);
// Or: socket.emit("Auth", JSON.stringify(credentials), cfg);
```

Tokens obtained through `Code` are persisted in `youtube_socket_token`. Wait for `TOKEN`/`channels` before invoking the API events below.

## Events

### Client → server

| Event | Arguments | Result |
| --- | --- | --- |
| `New` | `[cfg, newScopes]` | Starts OAuth and emits `Link`. |
| `Code` | `authorizationCode` | Exchanges the code, saves the token, then emits `TOKEN` and `channels`. |
| `Auth` | `credentialsJson[, cfg]` | Uses existing credentials, then emits `TOKEN` and `channels`. |
| `Search` | `[nextPageToken]` | Lists live broadcasts and emits `broadcasts`. |
| `VideoStatistic` | `videoId` | Fetches a video and emits `videos`. |
| `AnalyticsChannel` | no payload required | Emits the newest stored channel analytics snapshot. |
| `AnalyticsVideo` | no payload required | Emits the newest stored snapshot for each video (max. 100, sorted by views). |

### Server → client

| Event | Payload | Notes |
| --- | --- | --- |
| `Link` | `authorizationUrl` | Google OAuth URL after `New`. |
| `TOKEN` | `credentials` | OAuth credentials; `name` is the channel ID. Treat as secret. |
| `channels` | `channel[]` | Channel resources for the authenticated user. |
| `broadcasts` | YouTube API response | Result of `Search`. |
| `videos` | `video[]` | Result of `VideoStatistic`. |
| `AnalyticsChannel` | `{ data: snapshot \| null }` | Latest `channel_analytics_history` row. |
| `AnalyticsVideo` | `{ data: { rows: snapshot[] } }` | Latest per-video rows from `video_analytics_history`. |
| `API Error` | message parts | YouTube API or database error. |
| `TOKEN Error` | message parts | OAuth code exchange error. |

## Examples

### Live broadcasts

```js
socket.on("broadcasts", response => {
  for (const broadcast of response.data.items) {
    console.log(broadcast.id, broadcast.snippet.title);
  }
});
socket.emit("Search");
```

### Video details

```js
socket.on("videos", videos => console.log(videos[0]));
socket.emit("VideoStatistic", "dQw4w9WgXcQ");
```

### Analytics history

Analytics are imported by `SYTH-YouTube` and stored in the database. These events read the stored data; they do not make a fresh Google Analytics API request.

```js
socket.on("AnalyticsChannel", ({ data }) => {
  if (data) console.log("channel views:", data.views);
});
socket.on("AnalyticsVideo", ({ data }) => {
  for (const video of data.rows) console.log(video.video_id, video.views);
});

socket.emit("AnalyticsChannel");
socket.emit("AnalyticsVideo");
```

The channel importer deliberately uses non-revenue metrics so standard `yt-analytics.readonly` tokens work. Revenue fields in existing historical channel rows can be `NULL`.

## Operations

- Start/restart only `SYTH-YouTube`; do **not** start `SYTH-YT-API` again.
- Verify with `pm2 list` and `pm2 logs SYTH-YouTube`.
- gRPC streaming is the default for Live Chat. Set `YOUTUBE_LIVECHAT_TRANSPORT=poll` only as a rollback to REST polling.
