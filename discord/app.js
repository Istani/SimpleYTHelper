process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require('dotenv').config({ path: '../.env' });

const Discord = require('discord.js');
const client = new Discord.Client();

// DB Models
const Outgoing_Message = require("./models/outgoing_messages.js");
const Chat_Message = require("./models/chat_message.js");
const Chat_Room = require("./models/chat_room.js");
const Chat_Server = require("./models/chat_server.js");
const Chat_User = require("./models/chat_user.js");

//console.log(process.env.DISCORD_TOKEN);

client.login(process.env.DISCORD_TOKEN).catch(function (error) {
  if (error) {
    console.log("Client Login", error);
    process.exit(1);
  }
});

client.on('ready', () => {
  console.log(`Logged in as <${client.user.tag}>!`);
  client.user.setActivity('SYTH').then(presence => { console.log(`Activity set to ${presence.game ? presence.game.name : 'none'}`); }).catch(console.error);
  //SendMessage("225371711619465216", "test");
  setTimeout(CheckForMessages, 1000);
});

client.on('error', error => {
  console.log("Client Error", error);
  process.exit(1);
});

client.on('disconnect', event => {
  console.log("Client Event", "Disconnect");
  process.exit(1);
});

/* Custom Stuff */
client.on('message', msg => {
  var guild = msg.guild;
  if (guild == null) {
    guild = {};
    guild.id = msg.author.id;
    guild.name = 'DM';
  }
  AddGuild(guild);
  var channel = msg.channel;
  AddChannel(channel, guild);
  var user = msg.author;
  AddUser(user, guild);

  AddMessage(msg, guild, channel, user);
});

async function CheckForMessages() {
  var msgs = await Outgoing_Message.query().where('service', package_info.name);
  if (msgs.length > 0) {
    for (var i = 0; i < msgs.length; i++) {
      await SendMessage(msgs[i].room, msgs[i].content);
      await Outgoing_Message.query().delete().where(msgs[i]);
    }
  }
  setTimeout(CheckForMessages, 1000);
}
async function SendMessage(channelID, msg) {
  console.log("Try to Send Message");
  client.channels.get(channelID).send(msg);
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
    console.log('Message:', JSON.stringify(tmp_message));
    await Chat_Message.query().insert(tmp_message);
  } else {
    //console.log('Message Repeat:', JSON.stringify(tmp_message));
    await Chat_Message.query().patch(tmp_message).where(m[0]);
  }

};

async function AddGuild(guild) {
  var tmp_server = {};

  // Keys
  tmp_server.service = package_info.name;
  tmp_server.server = guild.id;

  var g = await Chat_Server.query().where(tmp_server);

  // Additions
  tmp_server.name = guild.name;

  if (g.length == 0) {
    console.log('Server:', JSON.stringify(tmp_server));
    await Chat_Server.query().insert(tmp_server);
  } else {
    await Chat_Server.query().patch(tmp_server).where(g[0]);
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
    console.log('Room:', JSON.stringify(tmp_room));
    await Chat_Room.query().insert(tmp_room);
  } else {
    await Chat_Room.query().patch(tmp_room).where(c[0]);
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
    console.log('User:', JSON.stringify(tmp_user));
    await Chat_User.query().insert(tmp_user);
  } else {
    await Chat_User.query().patch(tmp_user).where(u[0]);
  }
}
