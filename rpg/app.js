process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require("dotenv").config({ path: "../.env" });
// ---
const fs = require("fs");
const io = require("socket.io")(3004);
const sleep = require("await-sleep");

const Messages = require("./models/chat_message.js");
const Rooms = require("./models/chat_room.js");
const Server = require("./models/chat_server.js");
const Chat_User = require("./models/chat_user.js");
const Outgoing_Message = require("./models/outgoing_messages.js");

const User_Channel = require("./models/channel.js");

const RPG_Monster = require("./models/rpg_monster.js");
const RPG_Char = require("./models/rpg_char.js");

var settings = {};
function load_settings() {
  try {
    settings = require("./temp/settings.json");
    settings.last_time = new Date(settings.last_time);
  } catch (error) {
    console.error("Settings", "Couldn't load!");
    settings = {};
    settings.last_time = new Date();
    settings.last_time.setDate(settings.last_time.getDate() - 7);
    settings.mvp_role = "RPG-MVP";
    settings.min_dmg = 5;
    settings.min_hp = 100;
    settings.prefix = "?";
    settings.min_cooldown = 30;
  }
}
function save_settings() {
  var data = JSON.stringify(settings);
  fs.writeFileSync("./temp/settings.json", data);
  load_settings();
}
load_settings();

io.on("connection", function(socket) {
  socket.on("message", function(func, data) {
    if (func == "join") {
      socket.join(data);
      setTimeout(() => {
        send_mob(data);
        send_tank(data);
        send_log(data);
      }, 1000);
    }
    console.log(func, ":", data);
  });
  socket.on("disconnect", function() {});
});

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

async function send_mob(user) {
  var monsters = await RPG_Monster.query().where("owner", user);
  if (monsters.length > 0) {
    io.to(user).emit("mob", monsters[0]);
  } else {
    console.error("No Monster for " + user + "!");
  }
}
async function send_tank(user) {
  var tanks = await RPG_Char.query()
    .where("owner", user)
    .orderBy("threat", "DESC");
  if (tanks.length > 0) {
    io.to(user).emit("tank", tanks[0]);
  }
}
function send_log(user) {
  io.to(user).emit("log", { hp: getRandomInt(500), hp_max: 500 });
}

async function get_msg() {
  var msg_list = await Messages.query()
    .where("content", "like", settings.prefix + "%")
    .where("created_at", ">", settings.last_time);

  for (var i = 0; i < msg_list.length; i++) {
    settings.last_time = msg_list[i].created_at;
    save_settings();

    var username = await Chat_User.query()
      .where("server", msg_list[i].server)
      .where("user", msg_list[i].user);
    if (username.length == 0) {
      msg_list[i].username = "";
    } else {
      msg_list[i].username = username[0].name;
    }

    if (msg_list[i].content.startsWith(settings.prefix) != true) {
      continue;
    }

    // ToDo: Get SYTH-User out of DB
    var syth_user = 4;
    var temp_content = msg_list[i].content.split(" ");

    if (temp_content == settings.prefix + "spawn") {
      await genMonster(syth_user, msg_list[i]);
      await genChar(syth_user, msg_list[i]);
    }
    if (temp_content == settings.prefix + "attack") {
      await attackMosnter(syth_user, msg_list[i]);
    }

    if (temp_content == settings.prefix + "bot") {
      await sleep(1000);
      await outgoing(msg_list[i], "?spawn");
      await outgoing(msg_list[i], "?attack");
    }
    console.log(msg_list[i]);
    send_mob(syth_user);
  }

  save_settings();
  setTimeout(get_msg, 100);
}
get_msg();

async function genMonster(syth_user, msg) {
  var monsters = await RPG_Monster.query().where("owner", syth_user);
  if (monsters.length > 0) {
    if (monsters[0].hp <= 0) {
      await RPG_Monster.query()
        .delete()
        .where("owner", syth_user);
    }
  }
  monsters = await RPG_Monster.query().where("owner", syth_user);
  if (monsters.length == 0) {
    // Generate New Monster!
    var data = await User_Channel.query()
      .where("user_id", syth_user)
      .eager("VIPs");
    var vips = [];
    for (let cindex = 0; cindex < data.length; cindex++) {
      const element = data[cindex];
      for (let vindex = 0; vindex < element.VIPs.length; vindex++) {
        const element2 = element.VIPs[vindex];
        vips[vips.length] = element2;
      }
    }
    var rand = getRandomInt(vips.length);
    //vips[rand]
    var tmp_monster = {};
    tmp_monster.owner = syth_user;
    tmp_monster.name = "Dark " + vips[rand].member_name;
    tmp_monster.picture = vips[rand].picture;
    tmp_monster.atk = settings.min_dmg;
    tmp_monster.hp_max =
      parseInt((new Date() - vips[rand].since) / 1000 / 60 / 60 / 24 / 30 + 1) *
      settings.min_hp;
    tmp_monster.hp = tmp_monster.hp_max;
    await RPG_Monster.query().insert(tmp_monster);
    send_mob(syth_user);
    await outgoing(
      msg,
      "👾 Ein wildes " +
        tmp_monster.name +
        " erscheint! (" +
        tmp_monster.hp_max +
        " HP)"
    );
  }
}

async function genChar(syth_user, msg) {
  //
  var char = await RPG_Char.query()
    .where("owner", syth_user)
    .where("id", msg.user);
  if (char.length > 0) {
    return;
  }

  var my_char = {};
  my_char.owner = syth_user;
  my_char.id = msg.user;
  my_char.hp_max = settings.min_hp;
  my_char.atk = settings.min_dmg;
  my_char.threat = 0;

  // Chat_User
  chat_user = await Chat_User.query()
    .where("service", msg.service)
    .where("server", msg.server)
    .where("user", msg.user);
  if (chat_user.length > 0) {
    my_char.displayname = chat_user[0].name;
    my_char.hp_max += chat_user[0].msg_sum;
    my_char.atk += chat_user[0].msg_avg;
  }

  my_char.hp = my_char.hp_max;
  await RPG_Char.query().insert(my_char);
}

async function attackMosnter(syth_user, msg) {
  var monsters = await RPG_Monster.query()
    .where("owner", syth_user)
    .where("hp", ">", 0);
  if (monsters.length == 0) {
    await outgoing(msg, "🔍 " + msg.username + ": Kein Monster in Sicht!");
    return;
  }

  var char = await RPG_Char.query()
    .where("owner", syth_user)
    .where("id", msg.user);
  if (char.length == 0) {
    await genChar(syth_user, msg);
    var char = await RPG_Char.query()
      .where("owner", syth_user)
      .where("id", msg.user);
  }

  if (char[0].hp <= 0) {
    await outgoing(
      msg,
      "💀 " + msg.username + ": Ist Tot und kann nicht mehr angreifen!"
    );
    return;
  }

  // Finaly Attack!
  var tmp_dmg = char[0].atk;
  monsters[0].hp -= tmp_dmg;
  if (monsters[0].hp < 0) {
    tmp_dmg += monsters[0].hp;
    monsters[0].hp = 0;
  }
  char[0].threat += tmp_dmg;
  monsters[0].atk += tmp_dmg;
  monsters[0].counter_attacks++;
  await outgoing(
    msg,
    "⚔ " +
      msg.username +
      " hat " +
      tmp_dmg +
      " Schaden an " +
      monsters[0].name +
      " gemacht!"
  );

  // Update Monster, Char, Tank
  await RPG_Char.query()
    .patch(char[0])
    .where("owner", syth_user)
    .where("id", msg.user);
  var tanks = await RPG_Char.query()
    .where("owner", syth_user)
    .orderBy("threat", "DESC");
  if (monsters[0].counter_attacks >= 5 && monsters[0].hp > 0) {
    var mob_dmg = monsters[0].atk;
    tanks[0].hp -= monsters[0].atk;
    monsters[0].atk = 0;
    monsters[0].counter_attacks = 0;
    if (tanks[0].hp < 0) {
      mob_dmg += tanks[0].hp;
      tanks[0].hp = 0;
      tanks[0].threat = 0;
    }
    var tank_name = await Chat_User;
    await outgoing(
      msg,
      "⚔ " +
        monsters[0].name +
        " hat " +
        mob_dmg +
        " Schaden an " +
        tanks[0].displayname +
        " gemacht!"
    );
    await RPG_Char.query()
      .patch(tanks[0])
      .where("owner", tanks[0].owner)
      .where("id", tanks[0].id);
  }
  await RPG_Monster.query()
    .patch(monsters[0])
    .where("owner", syth_user);

  send_tank(syth_user);
  send_mob(syth_user);
}

async function outgoing(msg_data, content) {
  var tmp_chat = {};
  tmp_chat.service = msg_data.service;
  tmp_chat.server = msg_data.server;
  tmp_chat.room = msg_data.room;
  tmp_chat.content = content;
  await Outgoing_Message.query().insert(tmp_chat);
  await sleep(1000);
}
