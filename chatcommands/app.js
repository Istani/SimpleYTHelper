process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

const fs = require('fs');
const sleep = require('await-sleep');

// DB-Models
const Messages = require("./models/chat_message.js");
const Rooms = require("./models/chat_room.js");
const Server = require("./models/chat_server.js");
const Outgoing_Message = require("./models/outgoing_messages.js");
const Games = require("./models/game.js");
const Links = require("./models/game_link.js");

var prefix = '!';

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
  }
}
function save_settings() {
  var data = JSON.stringify(settings);
  fs.writeFileSync("./temp/settings.json", data);
  load_settings();
}
load_settings();

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
}

async function get_msg() {
  //console.log(prefix, settings.last_time);
  var msg_list = await Messages.query().where('content', 'like', prefix + '%').where('created_at', '>', settings.last_time);
  //console.log(msg_list);
  //console.log(commands);

  for (var i = 0; i < msg_list.length; i++) {
    settings.last_time = msg_list[i].created_at;
    save_settings();

    if (msg_list[i].content.startsWith(prefix) != true) {
      continue;
    }
    var temp_content = msg_list[i].content.split(" ");
    var found_index = commands.findIndex(function (element) {
      if (element.name == temp_content[0].replace(prefix, "")) {
        return true;
      } else {
        return false;
      }
    });
    if (typeof found_index == "undefined" || found_index == -1) {
      console.error("Unknown Command: ", temp_content[0]);
      continue;
    }
    if (typeof commands[found_index].function == "function") {
      await commands[found_index].function(msg_list[i]);
    }
    await sleep(1000);
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
      output_string += "\n"
      output_string += "**" + prefix + commands[i].name + "** ";
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

async function party_command(msg_data) {
  var output_string = "Party @everyone!";
  await outgoing(msg_data, output_string);
  output_string = "";
}
async function peel_command(msg_data) {
  var output_string = "Zero Peel!";
  await outgoing(msg_data, output_string);
  output_string = "";
}
async function gege_command(msg_data) {
  var output_string = "Was für ein geiles Game! Das klingt nach einer Runde Teemo Smite! ;)";
  await outgoing(msg_data, output_string);
  output_string = "";
}
async function game_command(msg_data) {
  var output_string = "";
  var temp_content = msg_data.content.split(" ");
  var methode = temp_content[1];
  var game = temp_content.slice(2).join(' ');
  var room = await Rooms.query().where({ room: msg_data.room });

  if (game == "") { game = room[0].name; }
  output_string += "__Suche:__ " + game + "\n";
  if (game != "%") {
    game = Games.getEncodedName(game);
    game += "%";
  }
  const g = await Games.query().where("name", "like", game).eager("[links]");

  if (methode == "") { methode = "get" };

  switch (methode) {
    case 'set':
      output_string += "Noch nicht implemtiert!";
      break;
    case 'get':
      if (g.length > 1) {
        output_string += "Für Welches Spiel möchtest du die Details wissen?\n";
        var string_start = output_string.length;
        for (var i = 0; i < g.length; i++) {
          output_string += g[i].display_name + "\n";
        }
      } else if (g.length == 0) {
        output_string += "Spiel nicht gefunden!\n";
      } else {
        output_string += "**" + g[0].display_name + "** \n";
        output_string += "http://games-on-sale.de/game/" + g[0].name + "\n";
        for (var l = 0; l = g[0].links.length; l++) {
          output_string += g[0].links[l].store + " " + g[0].links[l].price + "\n";
        }
      }
      break;
    case 'remove':
      output_string += "Noch nicht implemtiert!";
      break;
    default:
      output_string += "Unbekannter Parameter **" + methode + "**\n";
  }
  await outgoing(msg_data, output_string);
  output_string = "";
}


