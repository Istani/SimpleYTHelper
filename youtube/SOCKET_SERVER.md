# YouTube Socket Server Documentation

The YouTube module includes a Socket.IO server for real-time interaction and analytics reporting.

## Connection Details
- **Port:** 3006
- **Protocol:** Socket.IO

## Inbound Events (Client to Server)

### `New`
Initiates a new OAuth2 authorization flow.
- **Arguments:**
  - `cfg` (Object, optional): Custom OAuth2 configuration (`clientId`, `clientSecret`, `redirectUrl`).
  - `new_scopes` (Array, optional): Custom scopes to request.

### `Code`
Exchanges an authorization code for an access token.
- **Arguments:** `code` (String).

### `Auth`
Authenticates using existing credentials.
- **Arguments:**
  - `args` (JSON String): Serialized credentials object.
  - `cfg` (Object, optional): Custom OAuth2 configuration.

### `Search`
Lists live broadcasts for the authenticated channel.
- **Arguments:** `nextPageToken` (String, optional).

### `VideoStatistic`
Retrieves detailed statistics for a specific video.
- **Arguments:** `id` (String): YouTube Video ID.

### `AnalyticsChannel`
Retrieves the latest channel-level analytics from the database history.
- **Arguments:** `args` (Any, optional).

### `AnalyticsVideo`
Retrieves the latest video-level analytics snapshots for the channel from the database history.
- **Arguments:** `args` (Any, optional).

## Outbound Events (Server to Client)

### `Link`
Sent in response to `New`. Contains the Google authorization URL.
- **Payload:** `authUrl` (String).

### `TOKEN`
Sent after successful token acquisition or authentication.
- **Payload:** `credentials` (Object).

### `TOKEN Error`
Sent if token acquisition fails.
- **Payload:** Error message and error object.

### `API Error`
Sent if a YouTube API or Database request fails.
- **Payload:** Error message.

### `channels`
Sent after authentication. Contains channel information.
- **Payload:** `items` (Array).

### `broadcasts`
Sent in response to `Search`. Contains list of broadcasts.
- **Payload:** API response object.

### `videos`
Sent in response to `VideoStatistic`. Contains video details.
- **Payload:** `items` (Array).

### `AnalyticsChannel`
Sent in response to `AnalyticsChannel`. Contains the latest historical channel analytics snapshot.
- **Payload:** `{ data: snapshot }`.

### `AnalyticsVideo`
Sent in response to `AnalyticsVideo`. Contains an array of the latest analytics snapshots for the channel's videos.
- **Payload:** `{ data: { rows: snapshotArray } }`.
