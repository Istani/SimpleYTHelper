var self = module.exports = {
  execute: function (msg) {
    self.reload_commands();
    var returnmsg="";
    returnmsg+="**Commands:**\r\n";
    returnmsg+="\`\`\`\r\n";
    for (cmd in commands) {
      returnmsg+=cmd.toString()+"\r\n";
    }
    returnmsg+="\`\`\`";
    msg.channel.sendMessage(returnmsg).catch(console.error);
  },
  reload_commands: function () {
    var fs = require('fs');
    var files = fs.readdirSync("./command_scripts/");
    commands=null;
    commands={};
    for (var i = 0; i<files.length;i++) {
      var filename=files[i];
      var cmd_name=filename.split(".")[0];
      commands[cmd_name]=require("../command_scripts/"+filename);
    }
    return commands;
  },
  use_commands: function(command, msg) {
    if ((command in commands)) {
      if (typeof commands[command].execute == 'function') {
        time = Date.now();
        console.log(time + " " + msg.author.username + ": Command :"+msg.content);
        commands[command].execute(msg);
      }
    }
  },
};

var commands={};
var time=0;
