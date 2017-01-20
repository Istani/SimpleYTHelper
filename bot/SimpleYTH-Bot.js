const google_api_access =require('../token/bot.access.json');
//const google_api_refresh=require('../token/bot.refresh');
const private_settings  =require('./private_settings.json');

var mysql = require("mysql");
var connection = mysql.createConnection({
  host     : private_settings.mysql_host,
  user     : private_settings.mysql_user,
  password : private_settings.mysql_pass,
  database : private_settings.mysql_base
});

// Discrod Bot
var Discord = require("discord.js");
var discord_bot = new Discord.Client();

// Google Bot
var google_bot = require("./scripts/google_scripts.js");

// Logins
discord_bot.login(private_settings.discord_token);
google_bot.client(private_settings.google_clientid,private_settings.google_clientscret,google_api_access.access_token);

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
  SpeakToDevs("I am back online!");
});

discord_bot.on("message", function (msg) {
  // Starting Commands!
  var message=msg.content;
  if (message.startsWith(command_prefix)) {
    message=message.replace("!","");
    message=message.split(" ")[0];
    cmd.use_commands_discord(message,msg);
  }
});

var repeat_google_check=true;
function Google_CheckMessage() {
  var SQL_STRING = "SELECT id, displayMessage FROM livestream_chat WHERE `ignore` = '0' ORDER BY publishedAt LIMIT 1";
  connection.query(SQL_STRING, function (err, rows) {
    if (err != null) {
      SpeakToDevs("SQLite: " + err);
      repeat_google_check=false;
    }
    for (var i = 0; i < rows.length; i++) {
      var row_org = rows[i];
      var SQL_UPDATE ="UPDATE livestream_chat SET `ignore`='1' WHERE id='" + row_org.id + "'";
      connection.query(SQL_UPDATE, function (err, row) {
        if (err != null) {
          SpeakToDevs("SQLite: " + err);
          repeat_google_check=false;
        }
        var message = row_org.displayMessage;
        if (message.startsWith(command_prefix)) {
          message=message.replace("!","");
          message=message.split(" ")[0];
          cmd.use_commands_google(message,google_bot);
        }
      });
      //SpeakToDevs("Test Read: "+ row_org.displayMessage);
    }
  });
  if (repeat_google_check) {
    setTimeout(Google_CheckMessage,100);
  }
}
//Google_CheckMessage();

// Functions
function SpeakToDevs(msg) {
  time = Date.now();
  console.log(time + " ERR : --- : "+msg);
  // Discord
  var guilds = discord_bot.guilds;
  guilds.forEach(function (guild) {
    var channels =guild.channels;
    channels.forEach (function (channel) {
      if (channel.name.indexOf("development") > -1) {
        channel.sendMessage("Dear Devs: " + msg);
      };
    })
  })
}

/* YEAH MEHR EVENTS ZUM ABFRAGEN - Wegen reconnect und so */
discord_bot.on('disconnect', () => {
  time = Date.now();
  console.log(time + " BOT: --- :Disconnect!");
  process.exit();
});
