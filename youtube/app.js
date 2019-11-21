process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require("dotenv").config({ path: "../.env" });

var fs = require("fs");
var Queue = require("better-queue");

var readline = require("readline");
var { google } = require("googleapis");

// TODO: Token aus DB
var SCOPES = ["https://www.googleapis.com/auth/youtube"];
var TOKEN_DIR = __dirname + "/.credentials/";
var TOKEN_PATH = TOKEN_DIR + "youtube-nodejs-quickstart.json";

var OAuth2 = google.auth.OAuth2;
var service = google.youtube("v3");
var q = new Queue(function(tpye, input, cb) {
  console.log("Start Import: " + type);
  input();
  cb(null, result);
});

// TODO: Client Secret aus .ENV
fs.readFile("client_secret.json", function processClientSecrets(err, content) {
  if (err) {
    console.log("Error loading client secret file: " + err);
    return;
  }
  authorize(JSON.parse(content), StartImport);
});

function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  //  TODO: Token aus DB
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

// TODO: Token Gen aus Website
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url: ", authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log("Error while trying to retrieve access token", err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

// TODO: Token Store in DB
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != "EEXIST") {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
    if (err) throw err;
    console.log("Token stored to " + TOKEN_PATH);
  });
}

var LiveVideoID = undefined; // TODO: Irgendwie über DB damit Multi User klappt!
function StartImport(auth) {
  fs.writeFileSync("tmp/auth.json", JSON.stringify(auth, null, 2));
  // TODO: Cronjobs

  //q.push("Channels", () => { ListChannels(auth); });

  //q.push("Playlists", () => { ListPlaylists(auth); });

  q.push("Broadcasts", () => {
    SearchBroadcasts(auth);
  });
}

function ListChannels(auth, pageToken = "") {
  service.channels.list(
    {
      auth: auth,
      part:
        "id, brandingSettings, contentDetails, snippet, statistics,status,topicDetails",
      mine: true,
      maxResults: 50,
      pageToken: pageToken
    },
    function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      fs.writeFileSync(
        "tmp/channels.json",
        JSON.stringify(response.data, null, 2)
      );
      var data = response.data.items[0];
      //data = data.contentDetails.relatedPlaylists.uploads;
      //q.push("PlaylistsItems", () => { ListPlaylistItems(auth, data, response.data.nextPageToken); });
      //return;
      console.log(data);

      return;

      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        console.log(index + " : " + element.id + " : " + element.snippet.title);
      }
      if (typeof response.data.nextPageToken != "undefined") {
        q.push("Channels", () => {
          ListChannels(auth, response.data.nextPageToken);
        });
      }
    }
  );
}
function ListPlaylists(auth, pageToken = "") {
  service.playlists.list(
    {
      auth: auth,
      part: "snippet",
      mine: true,
      maxResults: 50,
      pageToken: pageToken
    },
    function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      fs.writeFileSync(
        "tmp/playlists.json",
        JSON.stringify(response.data, null, 2)
      );
      var data = response.data.items;
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        console.log(index + " : " + element.id + " : " + element.snippet.title);
      }
      if (typeof response.data.nextPageToken != "undefined") {
        q.push("Playlists", () => {
          ListPlaylists(auth, response.data.nextPageToken);
        });
      }
    }
  );
}
function ListPlaylistItems(auth, playlist, pageToken = "") {
  service.playlistItems.list(
    {
      auth: auth,
      part: "snippet",
      playlistId: playlist,
      maxResults: 50,
      pageToken: pageToken
    },
    function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      fs.writeFileSync(
        "tmp/playlistsitems.json",
        JSON.stringify(response.data, null, 2)
      );
      var data = response.data.items;
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        console.log(index + " : " + element.id + " : " + element.snippet.title);
      }
      if (typeof response.data.nextPageToken != "undefined") {
        q.push("PlaylistsItems", () => {
          ListPlaylistItems(auth, playlist, response.data.nextPageToken);
        });
      }
    }
  );
}
function SearchBroadcasts(auth, pageToken = "") {
  service.search.list(
    {
      auth: auth,
      part: "id",
      channelId: "UC5DOhI70dI3PnLPMkUsosgw",
      eventType: "live",
      type: "video"
    },
    function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      try {
        fs.writeFileSync(
          "tmp/Search.json",
          JSON.stringify(response.data, null, 2)
        );
        LiveVideoID = response.data.items[0].id.videoId;
        q.push("Broadcasts-List", () => {
          ListBroadcast(auth, LiveVideoID);
        });
      } catch (e) {
        setTimeout(() => {
          q.push("Broadcasts", () => {
            SearchBroadcasts(auth);
          });
        }, 1000 * 60 * 5);
      }
    }
  );
}
function ListBroadcast(auth, LiveVideoID) {
  service.liveBroadcasts.list(
    {
      auth: auth,
      part: "snippet",
      id: LiveVideoID,
      maxResults: 50
    },
    function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      fs.writeFileSync(
        "tmp/Broadcasts.json",
        JSON.stringify(response.data, null, 2)
      );
      var ChatID = response.data.items[0].snippet.liveChatId;
      q.push("LiveChat", () => {
        LiveChat(auth, ChatID);
      });
    }
  );
}
function LiveChat(auth, liveChatId, pageToken = "") {
  service.liveChatMessages.list(
    {
      auth: auth,
      part: "snippet",
      liveChatId: liveChatId,
      pageToken: pageToken,
      maxResults: 2000
    },
    function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      try {
        fs.writeFileSync(
          "tmp/chat.json",
          JSON.stringify(response.data, null, 2)
        );
        var txt = response.data.items;
        for (let index = 0; index < txt.length; index++) {
          const element = txt[index].snippet;
          //console.log(element.authorChannelId, ":", element.displayMessage);
        }

        if (pageToken == "") {
          writeChat(auth, liveChatId, "Defender833 FTW!");
        }
        if (typeof response.data.nextPageToken != "undefined") {
          setTimeout(() => {
            q.push("Playlists", () => {
              LiveChat(auth, liveChatId, response.data.nextPageToken);
            });
          }, 1000 * 5);
        }
      } catch (e) {
        setTimeout(() => {
          q.push("Broadcasts", () => {
            SearchBroadcasts(auth);
          });
        }, 1000 * 60 * 5);
      }
    }
  );
}

function writeChat(auth, chatId, Message) {
  service.liveChatMessages.insert(
    {
      auth: auth,
      part: "snippet",
      resource: {
        snippet: {
          type: "textMessageEvent",
          liveChatId: chatId,
          textMessageDetails: {
            messageText: Message
          }
        }
      }
    },
    function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      fs.writeFileSync(
        "tmp/chat_post.json",
        JSON.stringify(response.data, null, 2)
      );
      console.log(response);
    }
  );
}
