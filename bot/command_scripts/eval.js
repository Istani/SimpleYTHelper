var self = module.exports = {
  execute: function (message_row, SendFunc, NewMessageFunc)  {
    var IstaniUserID='202892723420659714';
    var code = message_row.mesage.split(" ").slice(1).join(" ");
    if (message_row.user==IstaniUserID) {
      var returnmsg="**Input**\r\n";
      returnmsg+="\`\`\`JS\`\`\r\n";
      returnmsg+=code;
      returnmsg+="\`\`\`\r\n";
      returnmsg+="**Output**\r\n";
      returnmsg+="\`\`\`\r\n";
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
      returnmsg+="\`\`\`\r\n";
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
