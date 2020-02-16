process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require("dotenv").config({ path: "../.env" });

const TwitchClient = require("twitch").default;
const TAccessToken = require("twitch").AccessToken;
const tmi = require("tmi.js");
const moment = require("moment");
const emoji = require("node-emoji");
const request = require("request");

const fs = require("fs");
const Queue = require("better-queue");
const cron = require("node-cron");
const sleep = require("await-sleep");

// DB Models,
const Token = require("./models/syth_token.js");
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
const Games = require("./models/game.js");

var RepeatDealy = 15 * 1000;
var q = new Queue(function(type, input, cb) {
  console.log("Start Import: " + type);
  input();
  cb(null, result);
});

const client = new tmi.Client({
  options: { debug: false },
  connection: {
    reconnect: true,
    secure: true
  },
  identity: {
    // https://twitchapps.com/tmi/
    username: process.env.TWITCH_Login,
    password: process.env.TWITCH_Passwort
  },
  channels: ["#istani", "#defender833"]
});
client.connect();

client.on("message", (channel, tags, message, self) => {
  if (self == true) {
    // Missiong informations
    //console.log(channel, message, tags);
    tags.id = moment() + "";
    tags["tmi-sent-ts"] = moment();
    tags["user-id"] = "BOT";
    tags["room-id"] = "WHY Twitch/TMI?";
  }
  console.log(tags);
  var server_data = {
    id: channel.replace("#", ""),
    name: channel.replace("#", "")
  };
  var channel_data = { id: tags["room-id"], name: tags["message-type"] }; // ?
  var user_data = { id: tags["user-id"], username: tags["display-name"] };
  var message_data = {
    id: tags.id,
    createdAt: moment(parseInt(tags["tmi-sent-ts"])).format(),
    content: message
  };
  AddGuild(server_data);
  AddChannel(channel_data, server_data);
  AddUser(user_data, server_data);
  AddMessage(message_data, server_data, channel_data, user_data);
});

client.on("connected", (adress, port) => {
  setTimeout(CheckForMessages, 100);
  //console.log(client);
});
client.on("disconnected", () => {
  // is that a thing?
  process.exit(1);
});

async function AddGuild(guild) {
  var tmp_server = {};

  // Keys
  tmp_server.service = "twitch";
  tmp_server.server = guild.id;

  var g = await Chat_Server.query().where(tmp_server);

  // Additions
  tmp_server.name = guild.name;

  if (g.length == 0) {
    console.log("Server:", JSON.stringify(tmp_server));
    await Chat_Server.query().insert(tmp_server);
  } else {
    await Chat_Server.query()
      .patch(tmp_server)
      .where(g[0]);
  }
}

async function AddChannel(channel, guild) {
  var tmp_room = {};

  // Keys
  tmp_room.service = "twitch";
  tmp_room.server = guild.id;
  tmp_room.room = channel.id;
  tmp_room.is_rpg = true;

  var c = await Chat_Room.query().where(tmp_room);

  // Additions
  tmp_room.name = channel.name;

  if (c.length == 0) {
    console.log("Room:", JSON.stringify(tmp_room));
    await Chat_Room.query().insert(tmp_room);
  } else {
    await Chat_Room.query()
      .patch(tmp_room)
      .where(c[0]);
  }
}

async function AddUser(user, guild) {
  var tmp_user = {};

  // Keys
  tmp_user.service = "twitch";
  tmp_user.server = guild.id;
  tmp_user.user = user.id;

  var u = await Chat_User.query().where(tmp_user);

  // Additions
  tmp_user.name = user.username;

  if (u.length == 0) {
    console.log("User:", JSON.stringify(tmp_user));
    await Chat_User.query().insert(tmp_user);
  } else {
    await Chat_User.query()
      .patch(tmp_user)
      .where(u[0]);
  }
}

async function AddMessage(msg, guild, channel, user) {
  var tmp_message = {};

  // Keys
  tmp_messageservice = "twitch";
  tmp_message.server = guild.id;
  tmp_message.room = channel.id;
  tmp_message.id = msg.id;

  var m = await Chat_Message.query().where(tmp_message);

  // Additons
  tmp_message.user = user.id;
  tmp_message.timestamp = msg.createdAt;
  tmp_message.content = msg.content;

  if (m.length == 0) {
    console.log("Message:", JSON.stringify(tmp_message));
    await Chat_Message.query().insert(tmp_message);
  } else {
    //console.log('Message Repeat:', JSON.stringify(tmp_message));
    await Chat_Message.query()
      .patch(tmp_message)
      .where(m[0]);
  }
}

async function CheckForMessages() {
  var msgs = await Outgoing_Message.query().where("service", "twitch");

  if (msgs.length > 0) {
    for (var i = 0; i < msgs.length; i++) {
      await SendMessage(msgs[i].server, emoji.emojify(msgs[i].content));
      await Outgoing_Message.query()
        .delete()
        .where(msgs[i]);
    }
  }
  setTimeout(CheckForMessages, 100);
}

async function SendMessage(channelID, msg) {
  client.say(channelID.replace("#", ""), msg);
}

async function ReadToken() {
  var Auth_Token = await Token.query().where("service", "twitch");
  console.log(Auth_Token.length);
  //console.log(Auth_Token);
  // fs.writeFileSync("tmp/auth.json", JSON.stringify(auth, null, 2));
  for (let auth_index = 0; auth_index < Auth_Token.length; auth_index++) {
    const element = Auth_Token[auth_index];

    var twitchClient = await TwitchClient.withCredentials(
      process.env.TWITCH_CLIENT,
      element.access_token,
      undefined,
      {
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
        refreshToken: element.refresh_token,
        onRefresh: async token => {
          //await Auth_Token.query().where(element).patch(token)
          console.log(element, token);
        }
      }
    );
    var temp = await twitchClient.getTokenInfo();
    console.log(temp);
    //GetStream(twitchClient, element.user_id);
    GetChannel(twitchClient, element.user_id);
  }
}
//ReadToken();

async function GetStream(twitchClient, syth_user) {
  var TokenInfo = await twitchClient.getTokenInfo();
  var Streams = await twitchClient.helix.streams.getStreamByUserId(
    TokenInfo.userId
  );

  var obj = {};
  obj.service = "twitch";
  obj.b_id = Streams.id;
  obj.owner = Streams.userId;
  obj.b_title = Streams.title;

  obj.actualStartTime = Streams.startDate;
  obj.actualEndTime = null;
  obj.liveChatId = "";

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

    await FakeMsg(TokenInfo.userName, obj.owner, "?spawn");
    await FakeMsg(
      TokenInfo.userName,
      obj.owner,
      "!announcement Livestream: https://www.twitch.tv/" +
        TokenInfo.userName +
        ""
    );
  }
  var Game = await Streams.getGame();
  var temp_game_name = Games.getEncodedName(Game.name);
  const g = await Games.query()
    .where("name", "like", temp_game_name)
    .eager("[links]");
  if (g.length == 1) {
    var tmp_room = {};

    tmp_room.service = "twitch";
    tmp_room.server = TokenInfo.userName;
    tmp_room.room = obj.owner;

    var c = await Chat_Room.query().where(tmp_room);
    if (c.length == 1) {
      c[0].linked_game = g[0].name;
      await Chat_Room.query()
        .patch(c[0])
        .where("room", c[0].room);
    }
  }
}

async function GetChannel(twitchClient, syth_user) {
  //var TokenInfo = await twitchClient.getTokenInfo();
  var User = await twitchClient.helix.users.getMe(false); //getUserById(TokenInfo.userId);
  //var follows = await User.getFollows();
  //console.log(follows);
  //return;
  //console.log(User);
  //return;

  var channel_obj = {};
  channel_obj.service = "twitch";
  channel_obj.user_id = syth_user;
  channel_obj.channel_id = User.id;
  channel_obj.channel_title = User.displayName;
  channel_obj.discription = User.description;
  //channel_obj.start_date = data.snippet.publishedAt;
  channel_obj.thumbnail = User.profilePictureUrl;
  channel_obj.banner = User.offlinePlaceholderUrl;

  //channel_obj.main_playlist = data.contentDetails.relatedPlaylists.uploads;
  channel_obj.views = User.view_count;
  //channel_obj.subscriber = data.statistics.subscriberCount;
  //channel_obj.videos = data.statistics.videoCount;
  console.log(channel_obj);
}
async function FakeMsg(server, room, content) {
  var tmp_message = {};

  // Keys
  tmp_message.service = "twitch";
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
    //await Chat_Message.query().insert(tmp_message);
    await sleep(1000);
  } else {
    FakeMsg(server, room, content);
  }
}
