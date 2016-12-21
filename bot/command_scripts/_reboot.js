var self = module.exports = {
  execute: function (msg) {
    var IstaniUserID='202892723420659714';
    if (msg.author.id==IstaniUserID) {
      msg.channel.sendMessage("Trying to REBOOT!").catch(console.error);
      process.exit();
    } else {
      msg.channel.sendMessage("No Permissions! Ask <@"+IstaniUserID+">").catch(console.error);
    }
  },
};
