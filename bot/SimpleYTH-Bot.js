const private_settings = require('./private_settings.json');

var Discord = require("discord.js");
var discord_bot = new Discord.Client();

discord_bot.login(private_settings.discord_token);

// Other Vars
var command_prefix = "!";

// Import Commands?
var cmd=require("./command_scripts/commands.js");
cmd.reload_commands();

discord_bot.on('ready', function () {
  console.log("Up and running!");
  discord_bot.user.setStatus('online', 'SimpleYTH');
});

discord_bot.on("message", function (msg) {
  // Starting Commands!
  var message=msg.content;
  if (message.startsWith(command_prefix)) {
    message=message.replace("!","");
    message=message.split(" ")[0];
    cmd.use_commands(message,msg);
  }
});
