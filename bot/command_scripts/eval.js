var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  check_permission: function (message_row, SendFunc, NewMessageFunc) {
    var permissions=false;
    
    if (message_row.user=="-1") {
      permissions=true;
    }
    
    permissions=true; // Fake Recht!
    
    if (permissions==false) {
      SendFunc("Du hast keine Rechte den Befehl auszuführen");
    } else {
      self.execute(message_row, SendFunc, NewMessageFunc);
    }
  },
  execute: function (message_row, SendFunc, NewMessageFunc)  {
    var IstaniUserID='202892723420659714';
    var code = message_row.message.split(" ").slice(1).join(" ");
    if (message_row.user==IstaniUserID) {
      var returnmsg="**Input**\r\n";
      returnmsg+="JS\r\n";
      returnmsg+=code;
      returnmsg+="\r\n";
      returnmsg+="**Output**\r\n";
      returnmsg+="\r\n";
      try {
        var evaled = eval(code);
        if (typeof evaled !== 'string') {
          evaled = require('util').inspect(evaled);
        }
        returnmsg+=clean(evaled);
      }
      catch(err) {
        returnmsg+=clean(err);
      }
      returnmsg+="\r\n";
      SendFunc(returnmsg);
      
    } else {
      SendFunc("No Permissions!");
    }
  },
};

function clean(text) {
  if (typeof(text) === "string") {
    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
  }
  else {
    return text;
  }
}
