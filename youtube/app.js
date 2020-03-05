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
const emoji = require("node-emoji");
const sleep = require("await-sleep");
const moment = require("moment");

var readline = require("readline");
var { google } = require("googleapis");

const sponsors = require("./models/member.js");
const ow_playlist = require("./models/playlists.js");
const ow_playlistitems = require("./models/playlists_items.js");
const ow_broadcasts = require("./models/broadcast.js");
const ow_videos = require("./models/videos.js");
const ow_channel = require("./models/channel.js");
const Outgoing_Message = require("./models/outgoing_messages.js");
const Chat_Message = require("./models/chat_message.js");
const Chat_Room = require("./models/chat_room.js");
const Chat_Server = require("./models/chat_server.js");
const Chat_User = require("./models/chat_user.js");
const Token = require("./models/syth_token.js");

var RepeatDealy = 15 * 1000;
var SCOPES = ["https://www.googleapis.com/auth/youtube"];
var OAuth2 = google.auth.OAuth2;
var service = google.youtube("v3");
var q = new Queue(function(type, input, cb) {
  console.log("Start Import: " + type);
  input();
  cb(null, result);
});

//const apis = google.getSupportedAPIs();
//console.log(apis);
//return;
async function startTokens() {
  await Token.query()
    .where("service", "youtube")
    .patch({ is_importing: false });
  authorize(StartImport);
}

async function authorize(callback) {
  var clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  var clientId = process.env.YOUTUBE_CLIENT_ID;
  var redirectUrl = process.env.YOUTUBE_CLINET_URI;
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  var user_token = await Token.query()
    .where("service", "youtube")
    .where("is_importing", false);
  for (let index = 0; index < user_token.length; index++) {
    const element = user_token[index];
    await Token.query()
      .where(element)
      .patch({ is_importing: true });
    oauth2Client.credentials = element;
    callback(oauth2Client);
  }
  setTimeout(() => {
    authorize(callback);
  }, 1000);
}
startTokens();

function tStartImport(auth) {
  var sic = auth.credentials;
  fs.writeFileSync("tmp/auth.json", JSON.stringify(auth, null, 2));
  q.push("Videos", () => {
    auth.credentials = sic;
    ListVideos(auth);
  });
}
function StartImport(auth) {
  var sic = auth.credentials;
  fs.writeFileSync("tmp/auth.json", JSON.stringify(auth, null, 2));

  q.push("Channels", () => {
    auth.credentials = sic;
    ListChannels(auth);
  });

  cron.schedule("*/30 * * * *", () => {
    q.push("Uploads", () => {
      auth.credentials = sic;
      ListNewUploads(auth);
    });
  });

  cron.schedule("*/15 * * * *", () => {
    q.push("Broadcasts", () => {
      auth.credentials = sic;
      SearchBroadcasts(auth);
    });
  });
  q.push("LiveChat", () => {
    auth.credentials = sic;
    LiveChat(auth);
    auth.credentials = sic;
    CheckForMessages(auth);
  });

  cron.schedule("50 21 * * *", () => {
    q.push("Channels", () => {
      auth.credentials = sic;
      ListChannels(auth);
    });
    q.push("Sponsors", () => {
      auth.credentials = sic;
      ListSponsors(auth);
    });
    setTimeout(() => {
      // Damit dann Channels und Sponsors vielleicht schon fertig ist
      q.push("Playlists", () => {
        auth.credentials = sic;
        ListPlaylists(auth);
      });
    }, RepeatDealy);
  });

  cron.schedule("50 22 * * *", () => {
    q.push("Videos", () => {
      auth.credentials = sic;
      ListVideos(auth);
    });
  });
  //ListSponsors(auth);
}

async function ListVideos(auth, pageToken = "") {
  var max_per_request = 50;
  pageToken = pageToken * 1; // parseInt wollte ja nicht mit einen leeren string arbeiten!

  var sic = auth.credentials;
  var channel_obj = await ow_channel
    .query()
    .where("service", "youtube")
    .where("user_id", sic.user_id);
  var playlists_obj = await ow_playlistitems
    .query()
    .where("pl_id", channel_obj[0].main_playlist)
    .limit(max_per_request)
    .offset(pageToken);
  var abfrage_string = "";
  for (let pl_index = 0; pl_index < playlists_obj.length; pl_index++) {
    const element = playlists_obj[pl_index];
    if (abfrage_string != "") {
      abfrage_string += ", ";
    }
    abfrage_string += element.video_id;
  }
  service.videos.list(
    {
      auth: auth,
      part: "id, snippet, statistics, status",
      //id: "3ISZGwwLj4g",
      //id: "UAImOvmh6ng",
      id: abfrage_string,
      maxResults: max_per_request,
      pageToken: ""
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      fs.writeFileSync(
        "tmp/videos.json",
        JSON.stringify(response.data, null, 2)
      );
      var data = response.data.items;
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        //console.log(element);

        var tmp_data = {};
        tmp_data.service = "youtube";
        tmp_data.v_id = element.id;
        tmp_data.owner = element.snippet.channelId;
        if (typeof element.snippet.thumbnails.standard != "undefined") {
          tmp_data.thumbnail = element.snippet.thumbnails.standard.url;
        } else {
          tmp_data.thumbnail = element.snippet.thumbnails.default.url;
        }
        tmp_data.title = element.snippet.title;
        tmp_data.description = element.snippet.description;
        tmp_data.privacyStatus = element.status.privacyStatus;
        tmp_data.publishedAt = moment(
          element.snippet.publishedAt
        ).toISOString();
        tmp_data.viewCount = element.statistics.viewCount;
        tmp_data.likeCount = element.statistics.likeCount;
        tmp_data.dislikeCount = element.statistics.dislikeCount;
        tmp_data.commentCount = element.statistics.commentCount;

        var m = await ow_videos
          .query()
          .where("service", tmp_data.service)
          .where("owner", tmp_data.owner)
          .where("v_id", tmp_data.v_id);

        if (m.length > 0) {
          await ow_videos
            .query()
            .patch(tmp_data)
            .where("service", tmp_data.service)
            .where("owner", tmp_data.owner)
            .where("v_id", tmp_data.v_id);
          //console.log("video patch: ", tmp_data.v_id);
        } else {
          console.log("video new: ", tmp_data.v_id);
          await ow_videos.query().insert(tmp_data);

          // TODO: Richtige Räume finden!
          var room = await Rooms.query().where({ is_announcement: true });
          for (let ri = 0; ri < room.length; ri++) {
            const element = room[ri];
            await FakeMsg(
              element.server,
              element.room,
              "!video " + tmp_data.v_id + ""
            );
          }
        }
      }

      if (data.length == max_per_request) {
        q.push("Videos", () => {
          auth.credentials = sic;
          ListVideos(auth, pageToken + max_per_request);
        });
      }
    }
  );
}

function ListChannels(auth, pageToken = "") {
  var sic = auth.credentials;
  service.channels.list(
    {
      auth: auth,
      part: "id, brandingSettings, contentDetails, snippet, statistics",
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
      channel_obj.description = data.snippet.description;
      channel_obj.start_date = data.snippet.publishedAt;
      channel_obj.thumbnail = data.snippet.thumbnails.high.url;
      channel_obj.banner = data.brandingSettings.image.bannerTvHighImageUrl;

      channel_obj.main_playlist = data.contentDetails.relatedPlaylists.uploads;
      channel_obj.views = data.statistics.viewCount;
      channel_obj.subscriber = data.statistics.subscriberCount;
      channel_obj.videos = data.statistics.videoCount;

      {
        // Add Server
        var tmp_server = {};

        // Keys
        tmp_server.service = "youtube";
        tmp_server.server = channel_obj.channel_id;

        var g = await Chat_Server.query().where(tmp_server);

        // Additions
        tmp_server.name = "Livestream";
        if (g.length == 0) {
          console.log("Server: ", JSON.stringify(tmp_server));
          await Chat_Server.query().insert(tmp_server);
        } else {
          await Chat_Server.query()
            .patch(tmp_server)
            .where(g[0]);
        }
      }

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
        console.log("Channel: ", JSON.stringify(channel_obj));

        q.push("PlaylistsItems", () => {
          auth.credentials = sic;
          ListPlaylistItems(auth, channel_obj.main_playlist);
        });
      }
    }
  );
}
function ListPlaylists(auth, pageToken = "") {
  var sic = auth.credentials;
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
          console.log("PlayList: ", JSON.stringify(tmp_message));
        }
        q.push("PlaylistsItems", () => {
          auth.credentials = sic;
          ListPlaylistItems(auth, tmp_message.pl_id);
        });
      }
      if (typeof response.data.nextPageToken != "undefined") {
        q.push("Playlists", () => {
          auth.credentials = sic;
          ListPlaylists(auth, response.data.nextPageToken);
        });
      }
    }
  );
}
async function ListNewUploads(auth) {
  var sic = auth.credentials;
  var data = await ow_channel
    .query()
    .where("user_id", auth.credentials.user_id);
  if (data.length == 0) return;
  if (data[0].main_playlist == "") return;
  q.push("PlaylistsItems Upload", () => {
    auth.credentials = sic;
    ListPlaylistItems(auth, data[0].main_playlist, "", false);
  });
}
function ListPlaylistItems(auth, playlist, pageToken = "", loadAll = true) {
  var sic = auth.credentials;
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
          console.log("PlayList Item: ", JSON.stringify(tmp_message));
        }
      }
      if (
        typeof response.data.nextPageToken != "undefined" &&
        loadAll == true
      ) {
        q.push("PlaylistsItems", () => {
          auth.credentials = sic;
          ListPlaylistItems(auth, playlist, response.data.nextPageToken);
        });
      }
    }
  );
}
function SearchBroadcasts(auth, pageToken = "") {
  var sic = auth.credentials;
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
            obj.liveChatId = "";
          } else {
            obj.liveChatId = element.snippet.liveChatId;
          }

          {
            // Add Room
            var tmp_room = {};

            // Keys
            tmp_room.service = "youtube";
            tmp_room.server = obj.owner;
            tmp_room.room = obj.liveChatId;

            var c = await Chat_Room.query().where(tmp_room);

            // Additions
            tmp_room.name = obj.b_title;
            tmp_room.is_rpg = true;
            if (obj.b_title.toLowerCase().includes("sponsored")) {
              tmp_room.is_rpg = false;
            }

            if (c.length == 0) {
              console.log("Room: ", JSON.stringify(tmp_room));
              await Chat_Room.query().insert(tmp_room);

              // Add Spawn?
              await FakeMsg(tmp_room.server, tmp_room.room, "?spawn");
              await FakeMsg(
                tmp_room.server,
                tmp_room.room,
                "!announcement Livestream: https://www.youtube.com/watch?v=" +
                  obj.b_id +
                  ""
              );
            } else {
              if (obj.actualEndTime != null) {
                tmp_room.is_rpg = false;
              }
              await Chat_Room.query()
                .patch(tmp_room)
                .where(c[0]);
            }
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
            console.log("Broadcast: ", obj);
            await ow_broadcasts.query().insert(obj);

            setTimeout(() => {
              q.push("LiveChat", () => {
                auth.credentials = sic;
                LiveChat(auth);
              });
            }, RepeatDealy);
          }
        }

        // Update Last Stream-Chats?
        var Stream_RPG_Chats = await Chat_Room.query()
          .where("service", "youtube")
          .where("is_rpg", true);
        for (
          let rpg_chat_index = 0;
          rpg_chat_index < Stream_RPG_Chats.length;
          rpg_chat_index++
        ) {
          const element = Stream_RPG_Chats[rpg_chat_index];
          console.log("Checking", element.name);
          var HasLiveStream = await ow_broadcasts
            .query()
            .where("liveChatId", element.room);
          if (HasLiveStream.length == 0) {
            element.is_rpg = false;
            await Chat_Room.query()
              .patch(element)
              .where("service", element.service)
              .where("server", element.server)
              .where("room", element.room);
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
      builder.where("liveChatId", "!=", "").whereNotNull("liveChatId");
    });
  if (
    typeof data[0].Livestream == "undefined" ||
    typeof data[0].Livestream[0] == "undefined"
  ) {
    setTimeout(() => {
      q.push("LiveChat", () => {
        auth.credentials = sic;
        LiveChat(auth);
      });
    }, RepeatDealy);
    return;
  }
  service.liveChatMessages.list(
    {
      auth: auth,
      part: "snippet, authorDetails",
      liveChatId: data[0].Livestream[0].liveChatId,
      pageToken: pageToken,
      maxResults: 2000
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        setTimeout(async () => {
          data[0].Livestream[0].liveChatId = "";
          await ow_broadcasts
            .query()
            .patch(data[0].Livestream[0])
            .where("service", data[0].Livestream[0].service)
            .where("owner", data[0].Livestream[0].owner)
            .where("b_id", data[0].Livestream[0].b_id);

          q.push("Broadcasts", () => {
            auth.credentials = sic;
            SearchBroadcasts(auth);
          });
          /*q.push("LiveChat", () => {
            auth.credentials = sic;
            LiveChat(auth);
          });*/
        }, RepeatDealy);
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
            console.log("Message: ", JSON.stringify(tmp_message));
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
          await sleep(1000);

          {
            // USER
            var tmp_user = {};

            // Keys
            tmp_user.service = "youtube";
            tmp_user.server = data[0].channel_id;
            tmp_user.user = element.snippet.authorChannelId;

            var u = await Chat_User.query().where(tmp_user);

            // Additions
            tmp_user.name = element.authorDetails.displayName;

            if (u.length == 0) {
              await Chat_User.query().insert(tmp_user);
              console.log("User: ", JSON.stringify(tmp_user));
            } else {
              await Chat_User.query()
                .patch(tmp_user)
                .where(u[0]);
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
            q.push("LiveChat", () => {
              auth.credentials = sic;
              LiveChat(auth, response.data.nextPageToken);
            });
          }, RepeatDealy);
        }
      } catch (e) {
        console.error(e);
        setTimeout(() => {
          q.push("LiveChat", () => {
            auth.credentials = sic;
            LiveChat(auth);
          });
        }, RepeatDealy);
      }
    }
  );
}
function ListSponsors(auth, pageToken = "") {
  var sic = auth.credentials;
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
          tmp_message.picture = element.sponsorDetails.profileImageUrl;

          if (m.length > 0) {
            await sponsors
              .query()
              .patch(tmp_message)
              .where("service", tmp_message.service)
              .where("owner", tmp_message.owner)
              .where("member_id", tmp_message.member_id);
          } else {
            await sponsors.query().insert(tmp_message);
            console.log("Sponsor: ", JSON.stringify(tmp_message));
          }
        }
        /* if (
          typeof response.data.nextPageToken != "undefined" &&
          response.data.nextPageToken != ""
        ) {
          console.log(response.data.nextPageToken);
          setTimeout(() => {
            q.push("Sponsors", () => {
              auth.credentials = sic;
              ListSponsors(auth, response.data.nextPageToken);
            });
          }, 1000 * 5);
        }*/
        var date = new Date();
        date.setDate(date.getDate() - 7);

        await sponsors
          .query()
          .delete()
          .where("updated_at", "<", date.toISOString());
      } catch (e) {
        console.error(e);
        setTimeout(() => {
          q.push("Sponsors", () => {
            auth.credentials = sic;
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
      await SendMessage(auth, msgs[i].room, emoji.emojify(msgs[i].content));
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
  var sic = auth.credentials;
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
      console.log("Post: ", Message);
    }
  );
}

async function FakeMsg(server, room, content) {
  var tmp_message = {};

  // Keys
  tmp_message.service = "youtube";
  tmp_message.server = server;
  tmp_message.room = room;
  tmp_message.id = new Date();

  var m = await Chat_Message.query().where(tmp_message);
  // Additons
  tmp_message.user = server;
  tmp_message.timestamp = new Date();
  tmp_message.content = content;

  if (m.length == 0) {
    console.log("Fake-Message: ", JSON.stringify(tmp_message));
    await Chat_Message.query().insert(tmp_message);
    await sleep(1000);
  } else {
    FakeMsg(server, room, content);
  }
}
