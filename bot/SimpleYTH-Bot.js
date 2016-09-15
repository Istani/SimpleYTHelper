const private_settings = require('./private_settings.json');

var Discord = require("discord.js");
var discord_bot = new Discord.Client();

discord_bot.login(private_settings.discord_token);

// Other Vars
var command_prefix = "!";

// Import Commands?
var commands = {};
commands["ping"] = require("./command_scripts/ping.js").ping;
commands["defender"] = require("./command_scripts/SimpleYTH.js").SimpleYTH;


discord_bot.on('ready', function () {
  console.log("Up and running!");
  discord_bot.user.setStatus('online', 'SimpleYTH');
});

discord_bot.on("message", function (msg) {
  // Log Messages!
  console.log("Msg: " + msg.guild.name + " - " + msg.author.username + " : " + msg.content);

  // Starting Commands!
  var message=msg.content;
  if (message.startsWith(command_prefix)) {
    message=message.replace("!","");
    message=message.split(" ")[0];
    if ((message in commands)) {
      if (typeof commands[message] == 'function') {
        commands[message](msg);
      }
    }
  }
});
