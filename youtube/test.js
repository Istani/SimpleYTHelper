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

var RepeatDealy = 30 * 1000;
var SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.channel-memberships.creator"
];
var OAuth2 = google.auth.OAuth2;
var service = google.youtube("v3");
var q = new Queue(function(type, input, cb) {
  console.log("Start Import: " + type);
  input();
  cb(null, result);
});

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

function StartImport(auth) {
  var sic = auth.credentials;
  fs.writeFileSync("tmp/auth.json", JSON.stringify(auth, null, 2));

  q.push("Sponsors", () => {
    auth.credentials = sic;
    ListMembers(auth);
  });
}

function ListMembers(auth, pageToken = "") {
  var sic = auth.credentials;
  service.members.list(
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
          "tmp/members.json",
          JSON.stringify(response.data, null, 2)
        );
        console.log(response.data);
        return;

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
