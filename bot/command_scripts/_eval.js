var self = module.exports = {
  execute: function (msg) {
    var IstaniUserID='202892723420659714';
    var code = msg.content.split(" ").slice(1).join(" ");
    if (msg.author.id==IstaniUserID) {
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
      msg.channel.sendMessage(returnmsg).catch(console.error);
      
    } else {
      msg.channel.sendMessage("No Permissions! Ask <@"+IstaniUserID+">").catch(console.error);
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
