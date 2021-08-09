process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

const fs = require("fs");
const sleep = require("await-sleep");
const cron = require("node-cron");
const moment = require("moment");

const io = require("socket.io")(3005, {
  cors: {
    origin: "http://games-on-sale.de:3000",
    methods: ["GET", "POST"]
  },
  origins: "http://games-on-sale.de:3000",
  handlePreflightRequest: (req, res) => {
    const headers = {
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin": "http://games-on-sale.de:3000", //req.headers.origin, //or the specific origin you want to give access to,
      "Access-Control-Allow-Credentials": false
    };
    res.writeHead(200, headers);
    res.end();
  }
});

// DB-Models
const Messages = require("./models/chat_message.js");
const Users = require("./models/chat_user.js");
const Rooms = require("./models/chat_room.js");
const Server = require("./models/chat_server.js");
const Outgoing_Message = require("./models/outgoing_messages.js");
const Games = require("./models/game.js");
const Links = require("./models/game_link.js");
const Videos = require("./models/videos.js");
const Member = require("./models/member.js");

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
    settings.prefix = "!";
  }
}
function save_settings() {
  var data = JSON.stringify(settings, null, 2);
  fs.writeFileSync("./temp/settings.json", data);
  load_settings();
}
load_settings();

io.on("connection", function(socket) {
  socket.on("message", function(func, data) {
    if (func == "join") {
      socket.join(data);
    }
  });
  socket.on("disconnect", function() {});
});
var syth_user = 4;

cron.schedule("00 00 * * * ", () => {
  makeStats();
});
//makeStats();

async function makeStats() {
  console.log("User Statistik");
  var date = new Date();
  date.setDate(date.getDate() - 30);

  var user = await Users.query();
  for (let uindex = 0; uindex < user.length; uindex++) {
    const element = user[uindex];

    var message = await Messages.query()
      .where("created_at", ">", date)
      .where("user", element.user)
      .where("server", element.server)
      .orderBy("created_at");

    var day_stat = {};
    element.msg_sum = 0;
    for (let mindex = 0; mindex < message.length; mindex++) {
      const element2 = message[mindex];
      element.msg_sum++;
      var tmp_dat = element2.created_at
        .toISOString()
        .replace("T", " ")
        .substr(0, 10);
      if (typeof day_stat[tmp_dat] == "undefined") {
        day_stat[tmp_dat] = 0;
      }
      day_stat[tmp_dat]++;
    }

    element.msg_avg = 0;
    if (element.msg_sum > 0) {
      element.msg_avg = parseInt(
        element.msg_sum / Object.keys(day_stat).length
      );
      if (Object.keys(day_stat).length == 0) {
        element.msg_avg = 0;
      }
      console.log(
        "User Statistik - " + element.user,
        "Sum",
        element.msg_sum,
        "Avg",
        element.msg_avg,
        "Days",
        Object.keys(day_stat).length
      );
    }
    await Users.query()
      .patch(element)
      .where("service", element.service)
      .where("server", element.server)
      .where("user", element.user);
  }
}

var commands = [];
commands[0] = {
  name: "commands",
  params: "",
  description: "Zeigt alle Befehle!",
  function: show_commands,
  visible: true
};
commands[1] = {
  name: "help",
  params: "",
  description: "Zeigt alle Befehle!",
  function: show_commands,
  visible: false
};
commands[2] = {
  name: "party",
  params: "",
  description: "Party für alle!",
  function: party_command,
  visible: true
};
commands[3] = {
  name: "peel",
  params: "",
  description: "Zero Peel!",
  function: peel_command,
  visible: true
};
commands[4] = {
  name: "gege",
  params: "",
  description: "Good Game!",
  function: gege_command,
  visible: true
};
commands[5] = {
  name: "game",
  params: "[set/get/remove] [GameName]",
  description: "Setze/Bekomme/Entferne Spielzuweisung für diesen Channel!",
  function: game_command,
  visible: true
};
commands[6] = {
  name: "set",
  params: "[rpg/announcement]",
  description: "Setze Channel!",
  function: channel_set,
  visible: false
};
commands[7] = {
  name: "unset",
  params: "[rpg/announcement]",
  description: "UnSetze Channel!",
  function: channel_unset,
  visible: false
};
commands[8] = {
  name: "announcement",
  params: "[text]",
  description: "Bekanntgebung!",
  function: announcement_command,
  visible: false
};
commands[9] = {
  name: "ehrenmann",
  params: "",
  description: "Ehre wem ehre gebührt",
  function: ehrenmann_command,
  visible: false
};
commands[10] = {
  name: "sombrero",
  params: "",
  description: "AiAiAiAiAi",
  function: sombrero_command,
  visible: true
};
commands[11] = {
  name: "martin",
  params: "",
  description: "Mister Defender 833",
  function: martin_command,
  visible: false
};
commands[12] = {
  name: "snacks",
  params: "",
  description: "Aristosnacks - Overly Posh Snack Reviews",
  function: snack_command,
  visible: true
};
commands[13] = {
  name: "video",
  params: "[id]",
  description: "Give me a Video",
  function: video_command,
  visible: true
};
commands[14] = {
  name: "monster",
  params: "",
  description: "Give me a Healpotion",
  function: monster_command,
  visible: true
};
commands[15] = {
  name: "knom",
  params: "",
  description: "mimimi",
  function: knom_command,
  visible: false
};
commands[16] = {
  name: "emma",
  params: "",
  description: "memes",
  function: emma_command,
  visible: false
};
commands[17] = {
  name: "istani",
  params: "",
  description: "Weltbester Mod",
  function: istani_command,
  visible: false
};
commands[18] = {
  name: "sport",
  params: "",
  description: "Ring Fit Sport!",
  function: sport_command,
  visible: true
};
commands[19] = {
  name: "quest",
  params: "",
  description: "Marks a Quest!",
  function: quest_command,
  visible: true
};
commands[20] = {
  name: "list",
  params: "",
  description: "List all Quests!",
  function: questlist_command,
  visible: false
};
commands[21] = {
  name: "rngvip",
  params: "",
  description: "Random VIP Name",
  function: rng_vip,
  visible: false
};
commands[22] = {
  name: "firma",
  params: "",
  description: "Martins Firma",
  function: firma,
  visible: true
};

async function get_msg() {
  //return;
  //console.log(prefix, settings.last_time);
  var msg_list = await Messages.query()
    .where("content", "like", settings.prefix + "%")
    .where("created_at", ">", settings.last_time);
  //console.log(msg_list);
  //console.log(commands);

  for (var i = 0; i < msg_list.length; i++) {
    settings.last_time = msg_list[i].created_at;
    save_settings();
    if (msg_list[i].content.startsWith(settings.prefix) != true) {
      continue;
    }

    var temp_content = msg_list[i].content.split(" ");
    var found_index = commands.findIndex(function(element) {
      return temp_content[0]
        .replace(settings.prefix, "")
        .toLowerCase()
        .startsWith(element.name);
    });
    if (typeof found_index == "undefined" || found_index == -1) {
      console.error("Unknown Command: ", temp_content[0]);
      continue;
    }
    if (typeof commands[found_index].function == "function") {
      await commands[found_index].function(msg_list[i]);
      io.to(syth_user).emit("command", commands[found_index].name);
    }
    //await sleep(1000);
  }

  save_settings();
  setTimeout(get_msg, 100);
}
get_msg();

async function outgoing(msg_data, content) {
  var tmp_chat = {};
  tmp_chat.service = msg_data.service;
  tmp_chat.server = msg_data.server;
  tmp_chat.room = msg_data.room;
  tmp_chat.content = content;
  await Outgoing_Message.query().insert(tmp_chat);
  await sleep(1000);
}

async function show_commands(msg_data) {
  var output_string = "__Bot-Befehle__\n";

  for (var i = 0; i < commands.length; i++) {
    if (commands[i].visible == true) {
      output_string += "\n";
      output_string += "**" + settings.prefix + commands[i].name + "** ";
      if (commands[i].params != "") {
        output_string += "*" + commands[i].params + "*\n";
      } else {
        output_string += "\n";
      }
      output_string += commands[i].description + "\n";
      await outgoing(msg_data, output_string);
      output_string = "";
    }
  }
}

async function announcement_command(msg_data) {
  // ToDo: User Filter
  var room = await Rooms.query().where({ is_announcement: true });
  var temp_content = msg_data.content.split(" ");
  var output_string = temp_content.slice(1).join(" ");

  for (let room_index = 0; room_index < room.length; room_index++) {
    const element = room[room_index];
    msg_data.service = element.service;
    msg_data.server = element.server;
    msg_data.room = element.room;
    await outgoing(msg_data, output_string);
  }
  output_string = "";
}
async function party_command(msg_data) {
  var output_string = "Party @everyone!"; // <a:party_parrot:750306235118649374>"; //<a:party_parrot:488517145504776194>"; // <a:PartyParrot:393549053629038594>
  if (msg_data.service.toLowerCase() == "discord") {
    output_string += " <a:party_parrot:750306235118649374>";
  }
  await outgoing(msg_data, output_string);
  output_string = "";
}
async function peel_command(msg_data) {
  var output_string = "Zero Peel!";
  await outgoing(msg_data, output_string);
  output_string = "";
}
async function gege_command(msg_data) {
  var output_string =
    "Was für ein geiles Game! Das klingt nach einer Runde Teemo Smite! ;)";
  await outgoing(msg_data, output_string);
  output_string = "";
}
async function channel_set(msg_data) {
  channel_status(msg_data, true);
}
async function channel_unset(msg_data) {
  channel_status(msg_data, false);
}
async function channel_status(msg_data, value) {
  var output_string = "";
  var room = await Rooms.query().where({ room: msg_data.room });
  var temp_content = msg_data.content.split(" ");
  var methode = temp_content[1];

  switch (methode) {
    case "rpg":
      room[0].is_rpg = value;
      console.log(room[0]);
      await Rooms.query()
        .patch(room[0])
        .where("room", room[0].room);
      output_string += room[0].name + " " + methode + ": " + value + "\n";
      break;
    case "announcement":
      room[0].is_announcement = value;
      console.log(room[0]);
      await Rooms.query()
        .patch(room[0])
        .where("room", room[0].room);
      output_string += room[0].name + " " + methode + ": " + value + "\n";
      break;
    default:
      output_string += "Unbekannter Parameter **" + methode + "**\n";
  }
  await outgoing(msg_data, output_string);
  output_string = "";
}
async function game_command(msg_data) {
  var output_string = "";
  var temp_content = msg_data.content.split(" ");
  var methode = temp_content[1];
  var game = temp_content.slice(2).join(" ");
  var room = await Rooms.query().where({ room: msg_data.room });

  if (game == "") {
    game = room[0].linked_game;
    if (game == null || game == "") {
      game = room[0].name;
    }
  }
  output_string += "__Suche:__ " + game + "\n";
  if (game != "%" && game.startsWith("$") != true) {
    game = Games.getEncodedName(game);
    game += "%";
  }
  const g = await Games.query()
    .where("name", "like", game)
    .eager("[links]");

  if (typeof methode == "undefined") {
    methode = "get";
  }

  switch (methode) {
    case "set":
      if (g.length == 1) {
        room[0].linked_game = g[0].name;
        console.log(room[0]);
        await Rooms.query()
          .patch(room[0])
          .where("room", room[0].room);
        output_string +=
          "Raum wurde auf: " + room[0].linked_game + " gesetzt!\n";
      } else if (game.startsWith("$")) {
        room[0].linked_game = game;
        await Rooms.query()
          .patch(room[0])
          .where("room", room[0].room);
        output_string +=
          "Raum wurde auf: " + room[0].linked_game + " gesetzt!\n";
      } else {
        output_string += "Kein explizietes Game gefunden! Wähle:\n";
        for (var i = 0; i < g.length; i++) {
          output_string += g[i].display_name + "\n";
        }
      }
      break;
    case "get":
      if (g.length > 1) {
        output_string += "Für Welches Spiel möchtest du die Details wissen?\n";
        for (var i = 0; i < g.length; i++) {
          output_string += g[i].display_name + "\n";
        }
      } else if (g.length == 0) {
        output_string += "Spiel nicht gefunden!\n";
      } else {
        output_string += "**" + g[0].display_name + "** \n";
        output_string += "https://games-on-sale.de/game/" + g[0].name + "\n";
        for (var l = 0; l < g[0].links.length; l++) {
          output_string +=
            g[0].links[l].store + ": " + g[0].links[l].formatPrice + "€\n";
        }
      }
      break;
    case "remove":
      room[0].linked_game = null;
      await Rooms.query()
        .patch(room[0])
        .where("room", room[0].room);
      output_string += "Raum - Game Zuweisung zurückgesetzt!";
      break;
    default:
      output_string += "Unbekannter Parameter **" + methode + "**\n";
  }
  await outgoing(msg_data, output_string);
  output_string = "";
}

async function ehrenmann_command(msg_data) {
  var output_string = ":DefEhre:";
  await outgoing(msg_data, output_string);
  output_string = "";
}

async function sombrero_command(msg_data) {
  var output_string = "Ai Ai Ai Ai Ai";
  await outgoing(msg_data, output_string);
  output_string = "";
}

async function martin_command(msg_data) {
  var output_string = "";
  output_string += "Website: https://defender833.de/\r\n";
  output_string += "Youtube: https://www.youtube.com/defender833\r\n";
  output_string += "Instagram: https://www.instagram.com/defender833/\r\n";
  output_string += "Twitter: https://twitter.com/Defender833\r\n";
  await outgoing(msg_data, output_string);

  output_string = "";
  output_string += "Facebook: https://www.facebook.com/DefenderYT/\r\n";
  await outgoing(msg_data, output_string);

  output_string = "";
}

async function snack_command(msg_data) {
  var output_string = "";
  output_string +=
    "Aristosnacks - Overly Posh Snack Reviews: https://games-on-sale.de/s/snacks";
  await outgoing(msg_data, output_string);
  output_string = "";
}
async function monster_command(msg_data) {
  var output_string = "";
  output_string +=
    "Ein gar edles Tröpfchen https://games-on-sale.de/s/monster #werbung";
  await outgoing(msg_data, output_string);
  output_string = "";
}
async function knom_command(msg_data) {
  var output_string = "";
  output_string += "mimimi";
  await outgoing(msg_data, output_string);
  output_string = "";
}
async function emma_command(msg_data) {
  var output_string = "";
  output_string += "memes be done my lord";
  await outgoing(msg_data, output_string);
  output_string = "";
}
async function istani_command(msg_data) {
  var output_string = "";
  output_string += "Weltbester Mod https://games-on-sale.de/";
  await outgoing(msg_data, output_string);
  output_string = "";
}

async function sport_command(msg_data) {
  var output_string = "";
  output_string +=
    "Denkt dran, jeden morgen Ring Fit Adventure mit Defender833! (Mo-Do 06:30 / Sa-So 09:00) https://games-on-sale.de/s/sport";
  await outgoing(msg_data, output_string);
  output_string = "";
}

async function video_command(msg_data) {
  var output_string = "";
  var temp_content = msg_data.content.split(" ");
  // TODO: Get Owner!
  if (typeof temp_content[1] != "undefined") {
    var v = await Videos.query()
      .where("owner", "UC5DOhI70dI3PnLPMkUsosgw")
      .where("v_id", temp_content[1]);
    if (v.length == 0) {
      temp_content.shift();
      var search = temp_content.join(" ");
      var v = await Videos.query()
        .where("owner", "UC5DOhI70dI3PnLPMkUsosgw")
        .where("title", "like", "%" + search + "%")
        .orderBy("publishedAt", "DESC")
        .limit(5);
    }
  } else {
    var v = await Videos.query()
      .where("owner", "UC5DOhI70dI3PnLPMkUsosgw")
      .where("publishedAt", "<", moment().toISOString())
      .where("privacyStatus", "public")
      .orderBy("publishedAt", "DESC");
  }
  if (v.length > 0) {
    for (let vidx = 0; vidx < v.length; vidx++) {
      const element = v[vidx];
      output_string =
        element.title + " " + "https://www.youtube.com/watch?v=" + element.v_id;
      await outgoing(msg_data, output_string);
    }
  } else {
    output_string += "Video nicht gefunden!";
  }
  await outgoing(msg_data, output_string);
  output_string = "";
}

async function quest_command(msg_data) {
  var output_string = "";
  output_string += "Added Timestamp at " + msg_data.timestamp;
  await outgoing(msg_data, output_string);
  output_string = "";
}
async function questlist_command(msg_data) {
  var output_string = "";
  // TODO: Da fehlt auch noch das Richtige Räume Finden, Martin verknüpft ja nicht seine Daten
  //output_string += "Quest within the Last 24hours (" + msg_data.timestamp +")\r\n";
  var questrequest = await Messages.query()
    .where("content", "like", "!quest%")
    .orderBy("created_at", "DESC")
    .limit(1);
  if (questrequest.length == 0) {
    output_string += "Keine Quest gefunden!\r\n";
    await outgoing(msg_data, output_string);
    output_string = "";
  } else {
    //console.log(questrequest);
    var questlist = await Messages.query()
      .where("server", questrequest[0].server)
      .where("room", questrequest[0].room)
      .where("content", "like", "!quest%")
      .orderBy("created_at");
    console.log("Quest gefunden: " + questlist.length);
    for (var i = 0; i < questlist.length; i++) {
      output_string +=
        questlist[i].timestamp + "\t" + questlist[i].content + "\r\n";
      await outgoing(msg_data, output_string);
      output_string = "";
    }
  }
}

async function rng_vip(msg_data) {
  // TODO: Nur vom richtigen Channel!
  var output_string = "";
  var members = await Member.query()
    .where("owner", "UC5DOhI70dI3PnLPMkUsosgw")
    .orderByRaw("RAND()");
  console.log("Member gefunden: " + members[0].member_name);
  output_string = members[0].member_name;
  await outgoing(msg_data, output_string);
  output_string = "";
}

async function firma(msg_data) {
  var output_string = "Schaust du hier: http://kw.media/";
  await outgoing(msg_data, output_string);
  output_string = "";
}
