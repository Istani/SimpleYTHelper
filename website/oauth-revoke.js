const https = require("https"),
  querystring = require("querystring");
function post(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        path,
        method: "POST",
        headers: Object.assign(
          { "content-length": Buffer.byteLength(body) },
          headers
        )
      },
      res => {
        res.resume();
        res.on("end", () =>
          res.statusCode >= 200 && res.statusCode < 300
            ? resolve()
            : reject(
                new Error(
                  "OAuth-Revoke wurde vom Provider abgelehnt (HTTP " +
                    res.statusCode +
                    ")."
                )
              )
        );
      }
    );
    req.setTimeout(10000, () =>
      req.destroy(
        new Error("OAuth-Revoke beim Provider hat zu lange gedauert.")
      )
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
async function revokeOAuthToken(token) {
  const service = String(token.service || "").toLowerCase(),
    value = token.refresh_token || token.access_token;
  if (!value)
    throw new Error(
      "Für diese Verbindung ist kein widerrufbarer OAuth-Token vorhanden."
    );
  if (service === "youtube")
    return post(
      "oauth2.googleapis.com",
      "/revoke",
      { "content-type": "application/x-www-form-urlencoded" },
      querystring.stringify({ token: value })
    );
  if (service === "twitch") {
    if (!process.env.TWITCH_CLIENT_ID)
      throw new Error("Twitch-Revoke ist nicht konfiguriert.");
    return post(
      "id.twitch.tv",
      "/oauth2/revoke",
      { "content-type": "application/x-www-form-urlencoded" },
      querystring.stringify({
        client_id: process.env.TWITCH_CLIENT_ID,
        token: value
      })
    );
  }
  if (service === "discord") {
    if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET)
      throw new Error("Discord-Revoke ist nicht konfiguriert.");
    const basic = Buffer.from(
      process.env.DISCORD_CLIENT_ID + ":" + process.env.DISCORD_CLIENT_SECRET
    ).toString("base64");
    return post(
      "discord.com",
      "/api/oauth2/token/revoke",
      {
        "content-type": "application/x-www-form-urlencoded",
        authorization: "Basic " + basic
      },
      querystring.stringify({
        token: value,
        token_type_hint: token.refresh_token ? "refresh_token" : "access_token"
      })
    );
  }
  throw new Error(
    "Für diese Plattform ist ein sicherer OAuth-Widerruf noch nicht implementiert."
  );
}
module.exports = { revokeOAuthToken };
