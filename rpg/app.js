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
const moment = require("moment");
const emoji = require("node-emoji"); // https://raw.githubusercontent.com/omnidan/node-emoji/master/lib/emoji.json

const Messages = require("./models/chat_message.js");
const Rooms = require("./models/chat_room.js");
const Server = require("./models/chat_server.js");
const Chat_User = require("./models/chat_user.js");
const Outgoing_Message = require("./models/outgoing_messages.js");

const User_Channel = require("./models/channel.js");

const RPG_Monster = require("./models/rpg_monster.js");
const RPG_Char = require("./models/rpg_char.js");
const RPG_Logs = require("./models/rpg_log.js");
const RPG_Items = require("./data/items.json");
const RPG_Inventory = require("./models/rpg_inventory.js");

var settings = {};
function load_settings() {
  try {
    settings = require("./temp/settings.json");
    settings.last_time = new Date(settings.last_time);
    if (typeof settings.inventory_space == "undefined") {
      settings.inventory_space = 30;
    }
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
    settings.inventory_space = 30;
  }
}
function save_settings() {
  var data = JSON.stringify(settings, null, 2);
  fs.writeFileSync("./temp/settings.json", data);
  load_settings();
}
load_settings();

async function Check_ItemData() {
  var uniq_key = [];
  for (let i_index = 0; i_index < RPG_Items.length; i_index++) {
    const element = RPG_Items[i_index];
    var keys = Object.keys(element);
    for (let k_index = 0; k_index < keys.length; k_index++) {
      const element2 = keys[k_index];
      if (uniq_key.indexOf(element2) == -1) {
        uniq_key.push(element2);
      }
    }
  }
  //console.log(uniq_key);
  for (let i_index = 0; i_index < RPG_Items.length; i_index++) {
    const element = RPG_Items[i_index];
    for (let k_index = 0; k_index < uniq_key.length; k_index++) {
      const element2 = uniq_key[k_index];
      if (typeof element[element2] == "undefined") {
        element[element2] = null;
      }
    }
  }
  var data = JSON.stringify(RPG_Items, null, 2);
  fs.writeFileSync("./data/items.json", data);
  // Noch nicht sicher ob das so eine gute Idee ist
}
Check_ItemData();

io.on("connection", function(socket) {
  socket.on("message", function(func, data) {
    if (func == "join") {
      socket.join(data);
      setTimeout(() => {
        send_mob(data);
        send_tank(data);
        send_old_log(data, socket);
      }, 1000);
    }
    //console.log(func, ":", data);
  });
  socket.on("disconnect", function() {});
});

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

async function send_log(user, text, org_message, users, numbers) {
  // Prepare Text!
  var output_text = text;
  if (typeof users != "udnefined") {
    for (var r_index = 0; r_index < users.length; r_index++) {
      output_text = output_text.replace(
        users[r_index],
        "<span class='username'>" + users[r_index] + "</span>"
      );
    }
  }
  if (typeof numbers != "udnefined") {
    for (var r_index = 0; r_index < numbers.length; r_index++) {
      output_text = output_text.replace(
        numbers[r_index],
        "<span class='special'>" + numbers[r_index] + "</span>"
      );
    }
  }
  output_text = emoji.unemojify(output_text);
  output_text = emoji.emojify(output_text);
  org_message.service = org_message.service.replace("syth-", ""); // Because i did an error at discord input
  var data = {
    id: moment() + "",
    owner: user,
    display_text: output_text,
    service: org_message.service,
    created_at: moment().format("YYYY-MM-DD HH:mm")
  };
  await RPG_Logs.query().insert(data);
  io.to(user).emit("log", data);
  //console.log(data);
}
async function send_old_log(user, socket) {
  var logs = await RPG_Logs.query()
    .where("owner", user)
    .orderBy("created_at", "DESC")
    .orderBy("id", "DESC")
    .limit(15);
  var reverse_logs = logs.reverse();
  for (let l_index = 0; l_index < reverse_logs.length; l_index++) {
    const element = reverse_logs[l_index];
    element.created_at = moment(element.created_at).format("YYYY-MM-DD HH:mm");
    element.display_text = emoji.emojify(element.display_text);
    socket.emit("log", element);
  }
}
async function send_mob(user) {
  var monsters = await RPG_Monster.query().where("owner", user);
  if (monsters.length > 0) {
    io.to(user).emit("mob", monsters[0]);
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

async function send_mvp(user, mvps) {
  io.to(user).emit("mvps", mvps);
}

async function get_msg() {
  var msg_list = await Messages.query()
    .where("content", "like", settings.prefix + "%")
    .where("created_at", ">", settings.last_time)
    .orderBy("created_at");

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
    //console.log(temp_content);
    if (temp_content[0].startsWith(settings.prefix + "spawn")) {
      await genMonster(syth_user, msg_list[i]);
<<<<<<< HEAD
      //      await genChar(syth_user, msg_list[i]);
=======
      //await genChar(syth_user, msg_list[i]);
>>>>>>> eec2ba07e5b38baf4e87844b743df2c20226922f
    }
    if (temp_content[0].startsWith(settings.prefix + "attack")) {
      var hasCooldown = await check_cooldown(syth_user, msg_list[i]);
      if (hasCooldown) {
        setTimeout(get_msg, 100);
        return;
      }
      await attackMosnter(syth_user, msg_list[i]);
    }
    if (temp_content[0].startsWith(settings.prefix + "charinfo")) {
      await showChar(syth_user, msg_list[i]);
    }
    if (temp_content[0].startsWith(settings.prefix + "mobinfo")) {
      await showMosnter(syth_user, msg_list[i]);
    }
    if (temp_content[0].startsWith(settings.prefix + "harvest")) {
      var hasCooldown = await check_cooldown(syth_user, msg_list[i]);
      if (hasCooldown) {
        setTimeout(get_msg, 100);
        return;
      }
      await collectRessource(syth_user, msg_list[i], "Heilkraut");
    }
    if (temp_content[0].startsWith(settings.prefix + "heal")) {
      var hasCooldown = await check_cooldown(syth_user, msg_list[i]);
      if (hasCooldown) {
        setTimeout(get_msg, 100);
        return;
      }
      await consumeItem(syth_user, msg_list[i], "heal");
    }

    if (temp_content[0].startsWith(settings.prefix + "bot")) {
      await sleep(1000);
      await outgoing(msg_list[i], settings.prefix + temp_content[1]);
    }
    send_mob(syth_user);
  }

  save_settings();
  setTimeout(get_msg, 100);
}
get_msg();

async function consumeItem(syth_user, msg, itemressource) {
  await genChar(syth_user, msg);
  var char = await RPG_Char.query()
    .where("owner", syth_user)
    .where("id", msg.user);
  var output_text = "";
  for (let item_index = 0; item_index < RPG_Items.length; item_index++) {
    const element = RPG_Items[item_index];
    if (element[itemressource] > 0) {
      var used_item = await removeItemToInventory(syth_user, msg, element);
      if (used_item) {
        switch (itemressource) {
          case "heal":
            var temp_heal = element.heal;
            char[0].threat += temp_heal * 0.5;
            char[0].hp += temp_heal;
            if (char[0].hp > char[0].hp_max) {
              temp_heal -= char[0].hp - char[0].hp_max;
              char[0].hp = char[0].hp_max;
            }
            await RPG_Char.query()
              .patch(char[0])
              .where("owner", char[0].owner)
              .where("id", char[0].id);
            output_text =
              "💊 " + char[0].displayname + " heilt sich um " + temp_heal + "!";
            if (temp_heal > 0) {
              send_log(
                syth_user,
                output_text,
                msg,
                [char[0].displayname],
                [temp_heal]
              );
            }
            send_tank(syth_user);
            await add_cooldown(syth_user, msg, settings.min_cooldown);
            break;
          default:
            addItemToInventory(syth_user, msg, item);
        }
        break;
      }
    }
  }
  if (output_text == "") {
    output_text = "❌ " + char[0].displayname + ": Kein Item gefunden!";
  }
  await outgoing(msg, output_text);
}
async function collectRessource(syth_user, msg, itemname) {
  var isCollected = false;
  var item = RPG_Items.find(e => {
    if (e.name == itemname) return true;
    return false;
  });
  await genChar(syth_user, msg);
  var char = await RPG_Char.query()
    .where("owner", syth_user)
    .where("id", msg.user);
  if (typeof item != "undefined") {
    isCollected = await addItemToInventory(syth_user, msg, item);
  }
  if (isCollected) {
    var text =
      "⛏ " +
      char[0].displayname +
      " sammelt " +
      item.icon +
      " " +
      item.name +
      "!";
    await add_cooldown(syth_user, msg, settings.min_cooldown);
  } else {
    var text =
      "❌ " + char[0].displayname + ": Item konnte nicht aufgesammelt werde!";
  }
  await outgoing(msg, text);
}
async function addItemToInventory(syth_user, msg, item) {
  var isAdded = false;
  var inventory = await RPG_Inventory.query()
    .where("owner", syth_user)
    .where("char_id", msg.user);
  if (inventory.length < settings.inventory_space) {
    await RPG_Inventory.query().insert({
      owner: syth_user,
      char_id: msg.user,
      item_name: item.name
    });
    isAdded = true;
  }
  return isAdded;
}
async function removeItemToInventory(syth_user, msg, item) {
  var isRemoved = false;
  var inventory = await RPG_Inventory.query()
    .where("owner", syth_user)
    .where("char_id", msg.user)
    .where("item_name", item.name);
  if (inventory.length > 0) {
    await RPG_Inventory.query()
      .delete()
      .where({ id: inventory[0].id });
    isRemoved = true;
  }
  return isRemoved;
}
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
    await RPG_Char.query()
      .delete()
      .where("owner", syth_user);
    await RPG_Logs.query()
      .delete()
      .where("owner", syth_user);
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
    var output_string =
      "👾 Ein wildes " +
      tmp_monster.name +
      " erscheint! (" +
      tmp_monster.hp_max +
      " HP)";
    await outgoing_multi(msg, output_string);
    send_log(
      syth_user,
      output_string,
      msg,
      [tmp_monster.name],
      [tmp_monster.hp_max]
    );
  } else {
    msg.content = settings.prefix + "mobinfo";
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
    var output_string =
      "💀 " + msg.username + ": Ist Tot und kann nicht mehr angreifen!";
    await outgoing(msg, output_string);
    send_log(syth_user, output_string, msg, [msg.username]);
    return;
  }

  // Finaly Attack!
  var tmp_dmg = char[0].atk;
  monsters[0].hp -= tmp_dmg;
  if (monsters[0].hp < 0) {
    tmp_dmg += monsters[0].hp;
    monsters[0].hp = 0;
  }
  char[0].total_dmg += tmp_dmg;
  char[0].threat += tmp_dmg;
  monsters[0].atk += tmp_dmg;
  monsters[0].counter_attacks++;
  var output_string =
    "⚔ " +
    msg.username +
    " hat " +
    tmp_dmg +
    " Schaden an " +
    monsters[0].name +
    " gemacht!";
  await outgoing(msg, output_string);
  send_log(
    syth_user,
    output_string,
    msg,
    [msg.username, monsters[0].name],
    [tmp_dmg]
  );

  // Update Monster, Char, Tank
  await RPG_Char.query()
    .patch(char[0])
    .where("owner", syth_user)
    .where("id", msg.user);
  await add_cooldown(syth_user, msg, settings.min_cooldown);
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
    var output_string =
      "⚔ " +
      monsters[0].name +
      " hat " +
      mob_dmg +
      " Schaden an " +
      tanks[0].displayname +
      " gemacht!";
    await outgoing(msg, output_string);
    send_log(
      syth_user,
      output_string,
      msg,
      [monsters[0].name, tanks[0].displayname],
      [mob_dmg]
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

  if (monsters[0].hp == 0) {
    var mvps = await RPG_Char.query()
      .where("owner", syth_user)
      .orderBy("total_dmg", "DESC")
      .limit(5);
    send_mvp(syth_user, mvps);
    var outgoing_messages = "👑 Ihr habt das Monster besiegt!";
    await outgoing_multi(msg, outgoing_messages);
    send_log(
      syth_user,
      outgoing_messages + " MVP: " + mvps[0].displayname,
      msg,
      [mvps[0].displayname],
      []
    );
    for (let m_index = 0; m_index < mvps.length; m_index++) {
      const element = mvps[m_index];
      await outgoing_multi(msg, m_index + 1 + ". " + element.displayname);
    }
  }
}

async function showMosnter(syth_user, msg) {
  var monsters = await RPG_Monster.query()
    .where("owner", syth_user)
    .where("hp", ">", 0);
  if (monsters.length == 0) {
    await outgoing(msg, "🔍 " + msg.username + ": Kein Monster in Sicht!");
    return;
  }
  var monster = monsters[0];
  var hp_text = monster.hp + "/" + monster.hp_max;
  var hp_details = ""; //██░░░░░░░ 23%"
  var hp_prozent = parseInt((monster.hp * 100) / monster.hp_max);
  var step_prozent = 5;
  var tmp_prozent = 0;
  while (tmp_prozent < 100) {
    tmp_prozent += step_prozent;
    if (tmp_prozent <= hp_prozent) {
      hp_details += "█";
    } else {
      hp_details += "░";
    }
  }
  hp_details += " " + hp_prozent + "%";
  var text = "❤ HP " + monster.name + " (" + hp_text + "): " + hp_details;
  outgoing(msg, text);
}

async function showChar(syth_user, msg) {
  await genChar(syth_user, msg);
  var chars = await RPG_Char.query()
    .where("owner", syth_user)
    .where("id", msg.user);

  var char = chars[0];
  var hp_text = char.hp + "/" + char.hp_max;
  var hp_details = ""; //██░░░░░░░ 23%"
  var hp_prozent = parseInt((char.hp * 100) / char.hp_max);
  var step_prozent = 5;
  var tmp_prozent = 0;
  while (tmp_prozent < 100) {
    tmp_prozent += step_prozent;
    if (tmp_prozent <= hp_prozent) {
      hp_details += "█";
    } else {
      hp_details += "░";
    }
  }
  hp_details += " " + hp_prozent + "%";
  var text = "❤ HP " + char.displayname + " (" + hp_text + "): " + hp_details;
  outgoing(msg, text);
}

async function check_cooldown(syth_user, msg) {
  var hasCooldown = false;
  await genChar(syth_user, msg);
  var chars = await RPG_Char.query()
    .where("owner", syth_user)
    .where("id", msg.user);

  var this_moment = moment();
  var next_moment = moment(chars[0].cooldown);

  if (next_moment > this_moment) {
    hasCooldown = true;
  }

  if (hasCooldown == true) {
    var text = "❌ " + chars[0].displayname + ": Cooldown!";
    await outgoing(msg, text);
  }
  return hasCooldown;
}
async function add_cooldown(syth_user, msg, time) {
  var chars = await RPG_Char.query()
    .where("owner", syth_user)
    .where("id", msg.user);
  var dat = moment()
    .add(time, "seconds")
    .format();
  //console.log(dat);

  chars[0].cooldown = dat;

  await RPG_Char.query()
    .patch(chars[0])
    .where("owner", chars[0].owner)
    .where("id", chars[0].id);
}

async function outgoing(msg_data, content) {
  var tmp_chat = {};
  tmp_chat.service = msg_data.service;
  tmp_chat.server = msg_data.server;
  tmp_chat.room = msg_data.room;
  tmp_chat.content = content;
  console.log(msg_data.server + ": " + content);
  await Outgoing_Message.query().insert(tmp_chat);
  await sleep(1000);
}

async function outgoing_multi(msg_data, content) {
  // ToDo: User Filter
  var room = await Rooms.query().where({ is_rpg: true });

  for (let room_index = 0; room_index < room.length; room_index++) {
    const element = room[room_index];
    msg_data.service = element.service;
    msg_data.server = element.server;
    msg_data.room = element.room;
    await outgoing(msg_data, content);
  }
  output_string = "";
}
