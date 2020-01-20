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

const Messages = require("./models/chat_message.js");
const Rooms = require("./models/chat_room.js");
const Server = require("./models/chat_server.js");
const Outgoing_Message = require("./models/outgoing_messages.js");

const User_Channel = require("./models/channel.js");

const RPG_Monster = require("./models/rpg_monster.js");

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
function send_tank(user) {
  io.to(user).emit("tank", { hp: getRandomInt(100), hp_max: 100 });
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

    if (msg_list[i].content.startsWith(settings.prefix) != true) {
      continue;
    }

    // ToDo: Get SYTH-User out of DB
    var syth_user = 4;
    var temp_content = msg_list[i].content.split(" ");

    if (temp_content == settings.prefix + "spawn") {
      genMonster(syth_user);
    }

    
    console.log(msg_list[i]);
    send_mob(syth_user);
  }

  save_settings();
  setTimeout(get_msg, 100);
}
get_msg();


function genMonster(syth_user) {
    var monsters = await RPG_Monster.query().where("owner", syth_user);
      if (monsters.length > 0) {
        if (monsters[0].hp <= 0) {
          await RPG_Monster.query()
            .delete()
            .where("owner", Check.syth_user);
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
          parseInt(
            (new Date() - vips[rand].since) / 1000 / 60 / 60 / 24 / 30 + 1
          ) * settings.min_hp;
        tmp_monster.hp = tmp_monster.hp_max;
        await RPG_Monster.query().insert(tmp_monster);
        send_mob(syth_user);
      }
}