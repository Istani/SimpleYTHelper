const private_settings = require('./private_settings.json');

var Discord = require("discord.js");
var discord_bot = new Discord.Client();

discord_bot.login(private_settings.discord_token);

// Other Vars
var command_prefix = "!";
var time=0;
var log_new_reconnect=false;

// Import Commands?
var cmd=require("./command_scripts/commands.js");
cmd.reload_commands();

discord_bot.on('ready', function () {
  time = Date.now();
  log_new_reconnect=true;
  console.log(time + " BOT: --- :Ready!");
  discord_bot.user.setStatus('online', 'SimpleYTH');
  Discord_NotifyDevChannels();
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

// Functions
function Discord_NotifyDevChannels() {
  var guilds = discord_bot.guilds;
  guilds.forEach(function (guild) {
    var channels =guild.channels;
    channels.forEach (function (channel) {
      if (channel.name.includes("development")) {
        channel.sendMessage("I am back!");
      };
    })
  })
  
}

/* YEAH MEHR EVENTS ZUM ABFRAGEN - Wegen reconnect und so */
discord_bot.on('disconnect', () => {
  time = Date.now();
  console.log(time + " BOT: --- :Disconnect!");
  discord_bot.login(private_settings.discord_token);
});
discord_bot.on('reconnecting', () => {
  if (log_new_reconnect) {
    time = Date.now();
    log_new_reconnect=false;
    console.log(time + " BOT: --- :Reconnecting!");
    discord_bot.login(private_settings.discord_token);
  }
});

discord_bot.on('error', (error) => {
  time = Date.now();
  log_new_reconnect=false;
  console.log(time + " BOT: --- :Error!");
  console.log(time + " BOT: --- :" + error + "");
});
discord_bot.on('warn', (warning) => {
  time = Date.now();
  log_new_reconnect=false;
  console.log(time + " BOT: --- :Warning!");
  console.log(time + " BOT: --- :" + warning + "");
});
