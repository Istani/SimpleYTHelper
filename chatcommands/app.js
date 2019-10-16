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

async function get_msg() {
  //console.log(prefix, settings.last_time);
  var msg_list = await Messages.query().where('content', 'like', prefix + '%').where('created_at', '>', settings.last_time);
  //console.log(msg_list);
  //console.log(commands);

  for (var i = 0; i < msg_list.length; i++) {
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
      commands[found_index].function(msg_list[i]);
    }
    await sleep(1000);
    settings.last_time = msg_list[i].created_at;
  }

  save_settings();
  //setTimeout(get_msg, 1000);
}
get_msg();

async function outgoing(msg_data, content) {
  var tmp_chat = {};
  tmp_chat.service = msg_data.service;
  tmp_chat.server = msg_data.server;
  tmp_chat.room = msg_data.room;
  tmp_chat.content = content;
  await Outgoing_Message.query().insert(tmp_chat);
}

function show_commands(msg_data) {
  var output_string = "__Bot-Befehle__\n\r";

  for (var i = 0; i < commands.length; i++) {
    if (commands[i].visible == true) {
      output_string += "\n\r"
      output_string += "**" + prefix + commands[i].name + "** ";
      if (commands[i].params != "") {
        output_string += "*" + commands[i].params + "*\n\r";
      } else {
        output_string += "\n\r";
      }
      output_string += commands[i].description + "\n\r";
      outgoing(msg_data, output_string);
      output_string = "";
    }
  }
}
function party_command(msg_data) {
  var output_string = "Party @everyone!";
  outgoing(msg_data, output_string);
  output_string = "";
}

