process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require("dotenv").config({ path: "../.env" });

const tmi = require("tmi.js");
const moment = require("moment");
const emoji = require("node-emoji");

// DB Models
const Outgoing_Message = require("./models/outgoing_messages.js");
const Chat_Message = require("./models/chat_message.js");
const Chat_Room = require("./models/chat_room.js");
const Chat_Server = require("./models/chat_server.js");
const Chat_User = require("./models/chat_user.js");

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
  channels: ["#Istani"]
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
  tmp_server.service = package_info.name;
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
  tmp_room.service = package_info.name;
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
  tmp_user.service = package_info.name;
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
  tmp_message.service = package_info.name;
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
  var msgs = await Outgoing_Message.query().where("service", package_info.name);

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
