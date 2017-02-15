// Private Settings
const private_settings  =require('./private_settings.json');

// Requier other Moduls
moment=require("moment");

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
  var UserRoles=[];
  msg.guild.member(msg.author).roles.forEach(function(element){
    UserRoles.push(element.name);
  });
  UpdateHosts("Discord", msg.guild.id, msg.guild.name);
  UpdateUser("Discord", msg.guild.id, msg.author.id, msg.author.username, UserRoles);
  LogMessage("Discord", msg.guild.id, msg.channel.id, msg.id, msg.createdTimestamp, msg.author.id, msg.content);
});

discord_bot.on('ready', function () {
  //discord_bot.user.setStatus('online', 'http://simpleyth.randompeople.de');
  discord_bot.user.setStatus('online', 'SimpleYTH');
});

discord_bot.on('disconnect', function () {
  process.exit();
});

// Google - Settings
var Google_Bot = require("./own_modules/Google_Bot");
var google_bot = new Google_Bot(mysql_connection);
google_bot.on("message", msg => {
  var UserRoles=[];
  UserRoles.push(msg.role);
  UpdateHosts("YouTube",msg.host, "Youtube Gaming");
  UpdateUser("YouTube", msg.host, msg.author, msg.authorname, UserRoles);
  LogMessage("YouTube", msg.host, msg.room, msg.id, msg.createdTimestamp, msg.author, msg.content);
});

// Whatever - Settings



// Bot Control
function StartBot() {
  Login();
  setTimeout(ProcessMessage,5000); // TODO: Statt Timeout, warten das alles initalisiert ist...?
}
var command_prefix = "!";
var cmd=require("./command_scripts/commands.js");
cmd.init(mysql_connection);
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
      discord_bot.login(rows[i].discrod_token);
      google_bot.login(rows[i].google_clientid,rows[i].google_clientsecret,rows[i].access_token);
    }
  });
}

function LogMessage(service, host, room, id, time, user, message) {
  time =  Math.round(moment()/1000); // timestamp überschreiben mit aktuellen Timestamo... wahrscheinlich gar keine so gute Idee!
  // log Message to MySQL;
  var tmp_felder="service='" + service.replace("'","") + "',";
  tmp_felder+="host='" + host.replace("'","") + "',";
  tmp_felder+="room='"+ room.replace("'","") +"',";
  tmp_felder+="id='"+ id.replace("'","") + "',";
  tmp_felder+="time='"+ time +"',";
  tmp_felder+="user='"+user.replace("'","")+"',";
  tmp_felder+="message='"+ message.replace("'","") + "'";
  var ADD_MESSAGE="INSERT INTO bot_chatlog SET " + tmp_felder + " ON DUPLICATE KEY UPDATE " + tmp_felder;
  mysql_connection.query(ADD_MESSAGE, function (err, rows) {
    if (err != null) {
      console.log("MySQL: " + err);
      return;
    }
  });
}

function UpdateHosts(service, host, hostname) {
  // Befehle per Host ein/aus schalten!?!
  var time = Date.now();
  var tmp_felder="service='" + service.replace("'","") + "',";
  tmp_felder+="host='" + host.replace("'","") + "',";
  tmp_felder+="name='" + hostname.replace("'","") + "',";
  tmp_felder+="last_seen='"+time+"'";
  var ADD_SQL="INSERT INTO bot_chathosts SET " + tmp_felder + " ON DUPLICATE KEY UPDATE " + tmp_felder;
  mysql_connection.query(ADD_SQL, function (err, rows) {
    if (err != null) {
      console.log("MySQL: " + err);
      return;
    }
  });
}

function UpdateUser(service, host, userid, username, roles) {
  var time = Date.now();
  var tmp_felder="service='" + service.replace("'","") + "',";
  tmp_felder+="host='" + host.replace("'","") + "',";
  tmp_felder+="user='"+userid.replace("'","")+"',";
  tmp_felder+="name='"+username.replace("'","")+"',";
  tmp_felder+="last_seen='"+time+"'";
  var ADD_SQL="INSERT INTO bot_chatuser SET " + tmp_felder + " ON DUPLICATE KEY UPDATE " + tmp_felder;
  mysql_connection.query(ADD_SQL, function (err, rows) {
    if (err != null) {
      console.log("MySQL: " + err);
      return;
    }
  });
  var DEL_SQL="DELETE FROM bot_chatuser_roles WHERE service='" + service.replace("'","") + "' AND host='"+host.replace("'","")+"' AND user='"+userid.replace("'","")+"'";
  mysql_connection.query(DEL_SQL, function (err, rows) {
    if (err != null) {
      console.log("MySQL: " + err);
    }
  });
  roles.forEach (function (r1) {
    UpdateRoles(service, host, r1);
    var tmp_felder="service='" + service.replace("'","") + "',";
    tmp_felder+="host='" + host.replace("'","") + "',";
    tmp_felder+="user='"+userid.replace("'","")+"',";
    tmp_felder+="role='"+r1.replace("'","")+"'";
    var ADD_SQL="INSERT INTO bot_chatuser_roles SET " + tmp_felder + " ON DUPLICATE KEY UPDATE " + tmp_felder;
    mysql_connection.query(ADD_SQL, function (err, rows) {
      if (err != null) {
        console.log("MySQL: " + err);
        return;
      }
    });
  });
  
}

function UpdateRoles(service, host, role) {
  var time = Date.now();
  var tmp_felder="service='" + service.replace("'","") + "',";
  tmp_felder+="host='" + host.replace("'","") + "',";
  tmp_felder+="role='"+role.replace("'","")+"'";
  var ADD_SQL="INSERT INTO bot_chatroles SET " + tmp_felder + " ON DUPLICATE KEY UPDATE " + tmp_felder;
  mysql_connection.query(ADD_SQL, function (err, rows) {
    if (err != null) {
      console.log("MySQL: " + err);
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
      GenerateAnwser(rows[i]);
      ProcessMessageUpdate(rows[i].service, rows[i].id)
    }
  });
  setTimeout(ProcessMessage, 100);
}

function ProcessMessageUpdate(service, id) {
  var UPDATE_MESSAGE="UPDATE `bot_chatlog` SET process='1' WHERE service='"+ service + "' AND id='"+ id + "'";
  mysql_connection.query(UPDATE_MESSAGE, function (err, rows) {
    if (err != null) {
      console.log("MySQL: " + err);
      return;
    }
  });
}

function GenerateAnwser(msg_row) {
  var msg=msg_row;
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
        //while (text.length>0) {
        setTimeout(function () {
          // TODO: Text in 200 Zeichen Teile Trennen!
          var SendText=text.substr(0,200);
          text=text.replace(SendText,"");
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
      cmd.use(command, msg,function (text) {
        var sendcount=0;
        setTimeout(function () {
          var SendText=text;
          console.log(SendText);
        }, sendcount*100);
      });
    }
  }
}

// Start Bot
StartBot();
