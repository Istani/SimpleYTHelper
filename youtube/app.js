process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require("dotenv").config({ path: "../.env" });

var fs = require("fs");
var Queue = require("better-queue");
var cron = require("node-cron");

var readline = require("readline");
var { google } = require("googleapis");

const sponsors = require("./models/member.js");
const ow_playlist = require("./models/playlists.js");
const ow_playlistitems = require("./models/playlists_items.js");
const ow_broadcasts = require("./models/broadcast.js");
const ow_channel = require("./models/channel.js");
const Outgoing_Message = require("./models/outgoing_messages.js");
const Chat_Message = require("./models/chat_message.js");
const Chat_Room = require("./models/chat_room.js");
const Chat_Server = require("./models/chat_server.js");
const Chat_User = require("./models/chat_user.js");
const tokens = require("./models/syth_token.js");

// TODO: Token aus DB
var SCOPES = ["https://www.googleapis.com/auth/youtube"];
var TOKEN_DIR = __dirname + "/.credentials/";
var TOKEN_PATH = TOKEN_DIR + "youtube-nodejs-quickstart.json";

var liveChatTimeout;
var OAuth2 = google.auth.OAuth2;
var service = google.youtube("v3");
var q = new Queue(function(type, input, cb) {
  console.log("Start Import: " + type);
  input();
  cb(null, result);
});

authorize(StartImport);
async function authorize(callback) {
  var clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  var clientId = process.env.YOUTUBE_CLIENT_ID;
  var redirectUrl = process.env.YOUTUBE_CLINET_URI;
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  var user_token = await tokens.query().where("service", "youtube");
  for (let index = 0; index < user_token.length; index++) {
    const element = user_token[index];
    oauth2Client.credentials = element;
    callback(oauth2Client);
  }
}

function StartImport(auth) {
  fs.writeFileSync("tmp/auth.json", JSON.stringify(auth, null, 2));
  // TODO: Cronjobs

  q.push("Channels", () => {
    ListChannels(auth);
  });
  cron.schedule("0 */1 * * *", () => {
    q.push("Channels", () => {
      ListChannels(auth);
    });
  });

  q.push("Broadcasts", () => {
    SearchBroadcasts(auth);
  });
  cron.schedule("*/15 * * * *", () => {
    q.push("Broadcasts", () => {
      SearchBroadcasts(auth);
    });
  });

  cron.schedule("00 01 * * *", () => {
    q.push("Sponsors", () => {
      ListSponsors(auth);
    });
  });

  cron.schedule("00 03 * * *", () => {
    q.push("Playlists", () => {
      ListPlaylists(auth);
    });
  });

  q.push("LiveChat", () => {
    LiveChat(auth);
  });

  CheckForMessages(auth);
}

function ListChannels(auth, pageToken = "") {
  var sic = auth.credentials;
  service.channels.list(
    {
      auth: auth,
      part:
        "id, brandingSettings, contentDetails, snippet, statistics, topicDetails",
      mine: true,
      maxResults: 50,
      pageToken: pageToken
    },
    async function(err, response) {
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
      channel_obj.service = "youtube";
      channel_obj.user_id = sic.user_id;
      channel_obj.channel_id = data.id;
      channel_obj.channel_title = data.snippet.title;
      channel_obj.discription = data.snippet.discription;
      channel_obj.start_date = data.snippet.publishedAt;
      channel_obj.thumbnail = data.snippet.thumbnails.high.url;
      channel_obj.banner = data.brandingSettings.image.bannerTvHighImageUrl;

      channel_obj.main_playlist = data.contentDetails.relatedPlaylists.uploads;
      channel_obj.views = data.statistics.viewCount;
      channel_obj.subscriber = data.statistics.subscriberCount;
      channel_obj.videos = data.statistics.videoCount;
      /*
      channel_obj.topics = [];
      var tmp_topics = data.topicDetails.topicCategories;
      for (let index = 0; index < tmp_topics.length; index++) {
        const element = tmp_topics[index];
        channel_obj.topics[index] = element;
      }
      */

      var m = await ow_channel
        .query()
        .where("service", channel_obj.service)
        .where("user_id", channel_obj.user_id)
        .where("channel_id", channel_obj.channel_id);

      if (m.length > 0) {
        await ow_channel
          .query()
          .patch(channel_obj)
          .where("service", channel_obj.service)
          .where("user_id", channel_obj.user_id)
          .where("channel_id", channel_obj.channel_id);
      } else {
        await ow_channel.query().insert(channel_obj);
        console.log(JSON.stringify(channel_obj));
      }

      q.push("PlaylistsItems", () => {
        ListPlaylistItems(auth, channel_obj.main_playlist);
      });
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
    async function(err, response) {
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
        var tmp_message = {};
        tmp_message.service = "youtube";
        tmp_message.owner = element.snippet.channelId;
        tmp_message.pl_id = element.id;
        tmp_message.pl_title = element.snippet.title;
        tmp_message.publishedAt = element.snippet.publishedAt;
        tmp_message.description = element.snippet.description;

        var m = await ow_playlist
          .query()
          .where("service", tmp_message.service)
          .where("owner", tmp_message.owner)
          .where("pl_id", tmp_message.pl_id);

        if (m.length > 0) {
          await ow_playlist
            .query()
            .patch(tmp_message)
            .where("service", tmp_message.service)
            .where("owner", tmp_message.owner)
            .where("pl_id", tmp_message.pl_id);
        } else {
          await ow_playlist.query().insert(tmp_message);
          console.log(JSON.stringify(tmp_message));
        }
        q.push("PlaylistsItems", () => {
          ListPlaylistItems(auth, tmp_message.pl_id);
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
    async function(err, response) {
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
        var tmp_message = {};
        tmp_message.service = "youtube";
        tmp_message.owner = element.snippet.channelId;
        tmp_message.pl_id = playlist;
        tmp_message.position = element.snippet.position;
        tmp_message.video_Id = element.snippet.resourceId.videoId;

        var m = await ow_playlistitems
          .query()
          .where("service", tmp_message.service)
          .where("owner", tmp_message.owner)
          .where("pl_id", tmp_message.pl_id)
          .where("position", tmp_message.position);

        if (m.length > 0) {
          await ow_playlistitems
            .query()
            .patch(tmp_message)
            .where("service", tmp_message.service)
            .where("owner", tmp_message.owner)
            .where("pl_id", tmp_message.pl_id)
            .where("position", tmp_message.position);
        } else {
          await ow_playlistitems.query().insert(tmp_message);
          console.log(JSON.stringify(tmp_message));
        }
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
  service.liveBroadcasts.list(
    {
      auth: auth,
      part: "id, snippet",
      mine: true,
      maxResults: 10,
      pageToken: pageToken
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      try {
        fs.writeFileSync(
          "tmp/liveBroadcasts.json",
          JSON.stringify(response.data, null, 2)
        );

        for (let index = 0; index < response.data.items.length; index++) {
          const element = response.data.items[index];

          var obj = {};
          obj.service = "youtube";
          obj.b_id = element.id;
          obj.owner = element.snippet.channelId;
          obj.b_title = element.snippet.title;

          obj.actualStartTime = element.snippet.actualStartTime;
          if (typeof element.snippet.actualEndTime == "undefined") {
            obj.actualEndTime = null;
          } else {
            obj.actualEndTime = element.snippet.actualEndTime;
          }
          if (typeof element.snippet.liveChatId == "undefined") {
            obj.liveChatId = null;
          } else {
            obj.liveChatId = element.snippet.liveChatId;
          }

          var m = await ow_broadcasts
            .query()
            .where("service", obj.service)
            .where("owner", obj.owner)
            .where("b_id", obj.b_id);

          if (m.length > 0) {
            await ow_broadcasts
              .query()
              .patch(obj)
              .where("service", obj.service)
              .where("owner", obj.owner)
              .where("b_id", obj.b_id);
          } else {
            console.log(obj);
            await ow_broadcasts.query().insert(obj);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  );
}

async function LiveChat(auth, pageToken = "") {
  //console.log(auth);
  var sic = auth.credentials;
  var data = await ow_channel
    .query()
    .where("user_id", auth.credentials.user_id)
    .eager("Livestream")
    .modifyEager("Livestream", builder => {
      // Order children by age and only select id.
      builder.where("liveChatId", "!=", "");
    });
  if (
    typeof data[0].Livestream == "undefined" ||
    typeof data[0].Livestream[0] == "undefined"
  ) {
    setTimeout(() => {
      auth.credentials = sic;
      q.push("LiveChat", () => {
        LiveChat(auth);
      });
    }, 1000 * 5);
    return;
  }
  service.liveChatMessages.list(
    {
      auth: auth,
      part: "snippet",
      liveChatId: data[0].Livestream[0].liveChatId,
      pageToken: pageToken,
      maxResults: 2000
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        setTimeout(() => {
          auth.credentials = sic;
          q.push("Broadcasts", () => {
            SearchBroadcasts(auth);
          });
          q.push("LiveChat", () => {
            LiveChat(auth);
          });
        }, 1000 * 5);
        return;
      }
      try {
        var txt = response.data.items;
        for (let index = 0; index < txt.length; index++) {
          const element = txt[index];

          var tmp_message = {};

          // Keys
          tmp_message.service = "youtube";
          tmp_message.server = data[0].channel_id;
          tmp_message.room = data[0].Livestream[0].liveChatId;
          tmp_message.id = element.id;

          var m = await Chat_Message.query().where(tmp_message);
          // Additons
          tmp_message.user = element.snippet.authorChannelId;
          tmp_message.timestamp = element.snippet.publishedAt;
          tmp_message.content = element.snippet.displayMessage;

          if (m.length == 0) {
            console.log("Message:", JSON.stringify(tmp_message));
            await Chat_Message.query().insert(tmp_message);
          } else {
            //console.log('Message Repeat:', JSON.stringify(tmp_message));
            try {
              await Chat_Message.query()
                .patch(tmp_message)
                .where(m[0]);
            } catch (e) {
              console.error(e);
            }
          }
        }

        if (pageToken == "") {
          fs.writeFileSync(
            "tmp/chat.json",
            JSON.stringify(response.data, null, 2)
          );
        }
        if (typeof response.data.nextPageToken != "undefined") {
          setTimeout(() => {
            auth.credentials = sic;
            q.push("LiveChat", () => {
              LiveChat(auth, response.data.nextPageToken);
            });
          }, 1000 * 5);
        }
      } catch (e) {
        console.error(e);
        setTimeout(() => {
          auth.credentials = sic;
          q.push("LiveChat", () => {
            LiveChat(auth);
          });
        }, 1000 * 5);
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

          if (m.length > 0) {
            await sponsors
              .query()
              .patch(tmp_message)
              .where("service", tmp_message.service)
              .where("owner", tmp_message.owner)
              .where("member_id", tmp_message.member_id);
          } else {
            await sponsors.query().insert(tmp_message);
            console.log(JSON.stringify(tmp_message));
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

async function CheckForMessages(auth) {
  var sic = auth.credentials;
  var data = await ow_channel
    .query()
    .where("user_id", auth.credentials.user_id);

  var msgs = await Outgoing_Message.query()
    .where("service", "youtube")
    .where("server", data[0].channel_id);
  if (msgs.length > 0) {
    for (var i = 0; i < msgs.length; i++) {
      await SendMessage(auth, msgs[i].room, msgs[i].content);
      await Outgoing_Message.query()
        .delete()
        .where(msgs[i]);
    }
  }
  setTimeout(() => {
    auth.credentials = sic;
    CheckForMessages(auth);
  }, 100);
}
async function SendMessage(auth, channelID, msg) {
  console.log("Try to Send Message");
  writeChat(auth, channelID, msg);
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
