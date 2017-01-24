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

var LoadToken_String = "SELECT * FROM authtoken WHERE is_bot = '1' LIMIT 1";
connection.query(LoadToken_String, function (err, rows) {
  if (err != null) {
    console.log("Token konnten nicht geladen werden!");
    console.log(err);
    return;
  }
  for (var i = 0; i < rows.length; i++) {
    google_bot.init(SpeakToDevs);
    discord_bot.login(rows[i].discrod_token);
    google_bot.client(rows[i].google_clientid,rows[i].google_clientsecret,rows[i].access_token);
  }
});

function Reset_GoogleAuth() {
  var LoadToken_String = "SELECT * FROM authtoken WHERE is_bot = '1' LIMIT 1";
  connection.query(LoadToken_String, function (err, rows) {
    if (err != null) {
      console.log("Token konnten nicht geladen werden!");
      console.log(err);
      return;
    }
    for (var i = 0; i < rows.length; i++) {
      google_bot.client(rows[i].google_clientid,rows[i].google_clientsecret,rows[i].access_token);
    }
  });
}

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
  if (google_bot.is_started) {
    var SQL_STRING = "SELECT id, displayMessage, livechatid FROM livestream_chat WHERE `ignore` = '0' ORDER BY publishedAt LIMIT 1";
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
          var lcID=row_org.livechatid;
          if (message.startsWith(command_prefix)) {
            message=message.replace("!","");
            //message=message.split(" ")[0];
            Reset_GoogleAuth();
            cmd.use_commands_google(message, lcID, google_bot);
          }
        });
        //SpeakToDevs("Test Read: "+ row_org.displayMessage);
      }
    });
  }
  if (repeat_google_check) {
    setTimeout(Google_CheckMessage,100);
  }
}
Google_CheckMessage();

// Functions
function SpeakToDevs(msg) {
  time = Date.now();
  console.log(time + " ERR : --- : "+msg);
  // Discord
  //return;
  
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
