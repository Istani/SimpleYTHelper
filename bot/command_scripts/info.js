var self = module.exports = {
  execute: function (msg) {
    var returnmsg="**Info:** <@"+msg.author.id+">\r\n";
    //returnmsg+="\`\`\`\r\n";
    returnmsg+="ServerName: "+msg.guild.name+"\r\n";
    returnmsg+="ServerID: "+msg.guild.id+"\r\n";
    returnmsg+="UserID: "+msg.author.id+"\r\n";
    //returnmsg+="\`\`\`\r\n";
    msg.channel.sendMessage(returnmsg).catch(console.error);
  },
};
