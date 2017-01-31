// Private Settings
const private_settings  =require('./private_settings.json');

// Mysql - Settings
var mysql = require("mysql");
var mysql_connection = mysql.createConnection({
  host     : private_settings.mysql_host,
  user     : private_settings.mysql_user,
  password : private_settings.mysql_pass,
  database : private_settings.mysql_base
});

// Discord - Settings
// https://discordapp.com/oauth2/authorize?client_id=275587526457294848&scope=bot // Dev Shame Bot Add
var Discord = require("discord.js");
var discord_bot = new Discord.Client();
discord_bot.on("message", msg => {
  if(msg.author !== discord_bot.user) { // nicht auf eigene Nachrichten Reagieren!
    //msg.channel.sendMessage(msg.content);
    LogMessage("Discord", msg.guild.id, msg.channel.id, msg.id, msg.createdTimestamp, msg.author.id, msg.content);
  }
});

// Google - Settings
var Google_Bot = require("./own_modules/Google_Bot");
var google_bot = new Google_Bot(mysql_connection);
google_bot.on("message", msg => {
  if(msg.author !== google_bot.user) { // nicht auf eigene Nachrichten Reagieren!
    LogMessage("YouTube", msg.host, msg.room, msg.id, msg.createdTimestamp, msg.author, msg.content);
  }
});

// Whatever - Settings



// Bot Control
function StartBot() {
  Login();
  setTimeout(ProcessMessage,5000); // TODO: Statt Timeout, warten das alles initalisiert ist...?
}
var command_prefix = "!";
var cmd=require("./command_scripts/commands.js");
cmd.reload_commands();

function Login() {
  var LoadToken_String = "SELECT * FROM authtoken WHERE is_bot = '1' LIMIT 1";
  mysql_connection.query(LoadToken_String, function (err, rows) {
    if (err != null) {
      console.log("Token konnten nicht geladen werden!");
      console.log(err);
      return;
    }
    for (var i = 0; i < rows.length; i++) {
      // TODO: Login wieder einfügen!
      discord_bot.login(rows[i].discrod_token);
      google_bot.login(rows[i].google_clientid,rows[i].google_clientsecret,rows[i].access_token);
    }
  });
}

function LogMessage(service, host, room, id, time, user, message) {
  // log Message to MySQL;
  var tmp_felder="service='" + service + "',";
  tmp_felder+="host='" + host + "',";
  tmp_felder+="room='"+ room +"',";
  tmp_felder+="id='"+ id + "',";
  tmp_felder+="time='"+ time +"',";
  tmp_felder+="user='"+user+"',";
  tmp_felder+="message='"+ message + "'";
  var ADD_MESSAGE="INSERT INTO bot_chatlog SET " + tmp_felder + " ON DUPLICATE KEY UPDATE " + tmp_felder;
  mysql_connection.query(ADD_MESSAGE, function (err, rows) {
    if (err != null) {
      console.log("MySQL: " + err);
      mysql_connection.query( // Vielleicht ist der Fehler ja das die Tabelle nicht existiert?
        "CREATE TABLE `bot_chatlog` (`service` varchar(50) NOT NULL," +
        "`host` varchar(255) NOT NULL,"+
        "`room` varchar(255) NOT NULL,"+
        "`id` varchar(255) NOT NULL,"+
        "`time` int(20) NOT NULL,"+
        "`user` varchar(255) NOT NULL,"+
        "`message` text NOT NULL,"+
        "`process` int(1) NOT NULL DEFAULT '0'"+
        ") ENGINE=InnoDB DEFAULT CHARSET=latin1;", function (err, rows) {
          if (err != null) {
            console.log("MySQL: " + err);
            return;
          }
          // TRY AGAIN
          mysql_connection.query(ADD_MESSAGE, function (err, rows) {
            if (err != null) {
              console.log("MySQL: " + err);
            }
            return;
          });
        });
        return;
      }
    });
  }
  
  function ProcessMessage() {
    var LOAD_MESSAGE="SELECT * FROM `bot_chatlog` WHERE `process`=0 ORDER BY `time` LIMIT 1";
    mysql_connection.query(LOAD_MESSAGE, function (err, rows) {
      if (err != null) {
        console.log("MySQL: " + err);
        return;
      }
      for (var i = 0; i < rows.length; i++) {
        var msg=rows[i];
        msg.message = msg.message.toLowerCase();
        var check_command=false;
        var message=msg.message.toLowerCase();
        if (message.startsWith(command_prefix)) {
          message=message.replace("!","");
          command=message.split(" ")[0];
          if (cmd.is_command(command)) {
            check_command=true;
          }
        }
        
        if (check_command) { // Check if command!
          switch (msg.service) {
            case 'Discord':
            case 'Discord TTS':
            cmd.use(command, msg,function (text) {
              var sendcount=0;
              if (msg.service=="Discord TTS") {
                text="Sorry no TTS ATM!\r\n"+text;
              }
              //while (text.size>0) {
              setTimeout(function () {
                // TODO: Text in 200 Zeichen Teile Trennen!
                var SendText=text;
                var guilds = discord_bot.guilds;
                guilds.forEach(function (guild) {
                  if (guild.id==msg.host) {
                    var channels =guild.channels;
                    channels.forEach (function (channel) {
                      if (channel.id==msg.room) {
                        if (msg.service=="Discord TTS") {
                          channel.sendTTSMessage(SendText);
                          //channel.sendMessage(SendText);
                        } else {
                          channel.sendMessage(SendText);
                        }
                      };
                    })
                  }
                });
              }, sendcount*100);
              sendcount++;
              //}
            }, LogMessage);
            break;
            case 'YouTube':
            cmd.use(command, msg,function (text) {
              var sendcount=0;
              //while (text.size>0) {
              setTimeout(function () {
                // TODO: Text in 200 Zeichen Teile Trennen!
                var SendText=text;
                google_bot.sendMessage(msg.room, SendText);
              }, sendcount*100);
              sendcount++;
              //}
            }, LogMessage);
            break;
            default:
            console.log("MSG Service: " + msg.service + " unkonwn!");
          }
        }
        
        var UPDATE_MESSAGE="UPDATE `bot_chatlog` SET process='1' WHERE service='"+ msg.service + "' AND id='"+ msg.id + "'";
        mysql_connection.query(UPDATE_MESSAGE, function (err, rows) {
          if (err != null) {
            console.log("MySQL: " + err);
            return;
          }
        });
      }
    });
    setTimeout(ProcessMessage, 100);
  }
  
  // Start Bot
  StartBot();
