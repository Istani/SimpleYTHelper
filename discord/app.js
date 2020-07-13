process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require("dotenv").config({ path: "../.env" });

const Discord = require("discord.js");
const client = new Discord.Client();
const emoji = require("node-emoji");
const request = require("request");
const Queue = require("better-queue");
const cron = require("node-cron");

// DB Models
const Outgoing_Message = require("./models/outgoing_messages.js");
const Chat_Message = require("./models/chat_message.js");
const Chat_Room = require("./models/chat_room.js");
const Chat_Server = require("./models/chat_server.js");
const Chat_User = require("./models/chat_user.js");
const Token = require("./models/syth_token.js");
const ow_channel = require("./models/channel.js");

//console.log(process.env.DISCORD_TOKEN);
var q = new Queue(function(type, input, cb) {
  console.log("Start Import: " + type);
  input();
  cb(null, result);
});

client.login(process.env.DISCORD_TOKEN).catch(function(error) {
  if (error) {
    console.log("Client Login", error);
    process.exit(1);
  }
});

client.on("ready", () => {
  console.log(`Logged in as <${client.user.tag}>!`);
  client.user
    .setActivity("SYTH")
    .then(presence => {
      console.log(
        `Activity set to ${presence.game ? presence.game.name : "none"}`
      );
    })
    .catch(console.error);
  //SendMessage("225371711619465216", "test");
});

client.on("error", error => {
  console.log("Client Error", error);
  process.exit(1);
});

client.on("disconnect", event => {
  console.log("Client Event", "Disconnect");
  process.exit(1);
});

/* Custom Stuff */
client.on("message", msg => {
  var guild = msg.guild;
  if (guild == null) {
    guild = {};
    guild.id = msg.author.id;
    guild.name = "DM";
    guild.ownerID = msg.author.id;
  }
  AddGuild(guild);
  var channel = msg.channel;
  AddChannel(channel, guild);
  var user = msg.author;
  AddUser(user, guild);

  AddMessage(msg, guild, channel, user);
});

async function CheckForMessages() {
  var msgs = await Outgoing_Message.query()
    .where("service", package_info.name)
    .orWhere("service", package_info.name.replace("syth-", ""));
  if (msgs.length > 0) {
    for (var i = 0; i < msgs.length; i++) {
      await SendMessage(msgs[i].room, emoji.emojify(msgs[i].content));
      await Outgoing_Message.query()
        .delete()
        .where(msgs[i]);
    }
  }
  setTimeout(CheckForMessages, 100);
}
setTimeout(CheckForMessages, 5000);
async function SendMessage(channelID, msg) {
  console.log("Try to Send Message");
  client.channels.get(channelID).send(msg);
}

async function AddMessage(msg, guild, channel, user) {
  var tmp_message = {};

  // Keys
  tmp_message.service = package_info.name.replace("syth-", "");
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

async function AddGuild(guild) {
  var tmp_server = {};

  // Keys
  tmp_server.service = package_info.name.replace("syth-", "");
  tmp_server.server = guild.id;

  var g = await Chat_Server.query().where(tmp_server);

  // Additions
  tmp_server.name = guild.name;
  tmp_server.ownerID = guild.ownerID;

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
  tmp_room.service = package_info.name.replace("syth-", "");
  tmp_room.server = guild.id;
  tmp_room.room = channel.id;

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
  tmp_user.service = package_info.name.replace("syth-", "");
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

async function startTokens() {
  await Token.query()
    .where("service", "discord")
    .patch({ is_importing: false });
  ReadToken();
}
async function ReadToken() {
  var Auth_Token = await Token.query()
    .where("service", "discord")
    .where("is_importing", false);
  for (let auth_index = 0; auth_index < Auth_Token.length; auth_index++) {
    const element = Auth_Token[auth_index];

    await Token.query()
      .where(element)
      .patch({ is_importing: true });

    q.push("Channels", () => {
      GetChannel(element, element.user_id);
    });
  }
  setTimeout(ReadToken, 1000);
}
//startTokens();

async function GetChannel(token, syth_user) {
  var req = await request.get(
    "https://discordapp.com/api/users/@me",
    {
      auth: {
        bearer: token.access_token
      }
    },
    async function(err, resp, body) {
      if (err) {
        q.push("Channels", () => {
          GetChannel(element, element.user_id);
        });
        return;
      }
      var User = JSON.parse(body);

      var channel_obj = {};
      channel_obj.service = "discord";
      channel_obj.user_id = syth_user;
      channel_obj.channel_id = User.id;
      channel_obj.channel_title = User.username;
      channel_obj.description = "";
      channel_obj.thumbnail = User.avatar;

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
      }
    }
  );
}
