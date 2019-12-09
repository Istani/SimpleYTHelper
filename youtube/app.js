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

const sponsors = require("./models/member.js");

// TODO: Token aus DB
var SCOPES = ["https://www.googleapis.com/auth/youtube"];
var TOKEN_DIR = __dirname + "/.credentials/";
var TOKEN_PATH = TOKEN_DIR + "youtube-nodejs-quickstart.json";

var OAuth2 = google.auth.OAuth2;
var service = google.youtube("v3");
var q = new Queue(function(type, input, cb) {
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

  //q.push("Broadcasts", () => { SearchBroadcasts(auth, "UC5DOhI70dI3PnLPMkUsosgw"); });

  q.push("Sponsors", () => {
    ListSponsors(auth);
  });
}

function ListChannels(auth, pageToken = "") {
  service.channels.list(
    {
      auth: auth,
      part:
        "id, brandingSettings, contentDetails, snippet, statistics, topicDetails",
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
      var channel_obj = {};
      channel_obj.id = data.id;
      channel_obj.title = data.snippet.title;
      channel_obj.discription = data.snippet.discription;
      channel_obj.publishedAt = data.snippet.publishedAt;
      channel_obj.thumbnail = data.snippet.thumbnails.high.url;
      channel_obj.playlistUploads =
        data.contentDetails.relatedPlaylists.uploads;
      channel_obj.playlistLikes = data.contentDetails.relatedPlaylists.likes;
      channel_obj.viewCount = data.statistics.viewCount;
      channel_obj.subscriberCount = data.statistics.subscriberCount;
      channel_obj.videoCount = data.statistics.videoCount;
      channel_obj.topics = [];
      var tmp_topics = data.topicDetails.topicCategories;
      for (let index = 0; index < tmp_topics.length; index++) {
        const element = tmp_topics[index];
        channel_obj.topics[index] = element;
      }
      channel_obj.banner = data.brandingSettings.image.bannerTvHighImageUrl;

      console.log(JSON.stringify(channel_obj));
      //q.push("PlaylistsItems", () => { ListPlaylistItems(auth, channel_obj.playlistUploads); });
    }
  );
}
function ListPlaylists(auth, pageToken = "") {
  service.playlists.list(
    {
      auth: auth,
      part: "id, snippet",
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
        var playlist_obj = {};
        playlist_obj.channelId = element.snippet.channelId;
        playlist_obj.id = element.id;
        playlist_obj.title = element.snippet.title;
        //console.log(JSON.stringify(playlist_obj));
        q.push("PlaylistsItems", () => {
          ListPlaylistItems(auth, playlist_obj.id);
        });
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
        var playlistitem_obj = {};
        playlistitem_obj.id = playlist;
        playlistitem_obj.videoId = element.snippet.resourceId.videoId;
        console.log(JSON.stringify(playlistitem_obj));
      }
      if (typeof response.data.nextPageToken != "undefined") {
        q.push("PlaylistsItems", () => {
          ListPlaylistItems(auth, playlist, response.data.nextPageToken);
        });
      }
    }
  );
}
function SearchBroadcasts(auth, channelId, pageToken = "") {
  service.search.list(
    {
      auth: auth,
      part: "id",
      channelId: channelId,
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
          ListBroadcast(auth, channelId, LiveVideoID);
        });
      } catch (e) {
        console.error(e);
        setTimeout(() => {
          q.push("Broadcasts", () => {
            SearchBroadcasts(auth, channelId);
          });
        }, 1000 * 60 * 5);
      }
    }
  );
}
function ListBroadcast(auth, channelId, LiveVideoID) {
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
        LiveChat(auth, channelId, ChatID);
      });
    }
  );
}
function LiveChat(auth, channelId, liveChatId, pageToken = "") {
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
        var txt = response.data.items;
        for (let index = 0; index < txt.length; index++) {
          const element = txt[index].snippet;
          //console.log(element.authorChannelId, ":", element.displayMessage);
        }

        if (pageToken == "") {
          fs.writeFileSync(
            "tmp/chat.json",
            JSON.stringify(response.data, null, 2)
          );
          writeChat(auth, liveChatId, "Defender833 FTW!");
        }
        if (typeof response.data.nextPageToken != "undefined") {
          setTimeout(() => {
            q.push("LiveChats", () => {
              LiveChat(
                auth,
                channelId,
                liveChatId,
                response.data.nextPageToken
              );
            });
          }, 1000 * 5);
        }
      } catch (e) {
        console.error(e);
        setTimeout(() => {
          q.push("Broadcasts", () => {
            SearchBroadcasts(auth, channelId);
          });
        }, 1000 * 60 * 5);
      }
    }
  );
}
function ListSponsors(auth, pageToken = "") {
  service.sponsors.list(
    {
      auth: auth,
      part: "snippet",
      maxResults: 50
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      try {
        fs.writeFileSync(
          "tmp/sponsors.json",
          JSON.stringify(response.data, null, 2)
        );

        var txt = response.data.items;
        for (let index = 0; index < txt.length; index++) {
          var element = txt[index].snippet;
          var tmp_message = {};
          tmp_message.service = "youtube";
          tmp_message.owner = element.channelId;
          tmp_message.member_id = element.sponsorDetails.channelId;

          var m = await sponsors
            .query()
            .where("service", tmp_message.service)
            .where("owner", tmp_message.owner)
            .where("member_id", tmp_message.member_id);
          tmp_message.member_name = element.sponsorDetails.displayName;
          tmp_message.since = element.sponsorSince;

          console.log(JSON.stringify(tmp_message));

          if (m.length > 0) {
            await sponsors
              .query()
              .patch(tmp_message)
              .where("service", tmp_message.service)
              .where("owner", tmp_message.owner)
              .where("member_id", tmp_message.member_id);
          } else {
            await sponsors.query().insert(tmp_message);
          }
        }
        /* if (
          typeof response.data.nextPageToken != "undefined" &&
          response.data.nextPageToken != ""
        ) {
          console.log(response.data.nextPageToken);
          setTimeout(() => {
            q.push("Sponsors", () => {
              ListSponsors(auth, response.data.nextPageToken);
            });
          }, 1000 * 5);
        }*/
      } catch (e) {
        console.error(e);
        setTimeout(() => {
          q.push("Sponsors", () => {
            ListSponsors(auth);
          });
        }, 1000 * 60 * 5);
      }
    }
  );
}
