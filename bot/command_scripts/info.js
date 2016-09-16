var self = module.exports = {
  execute: function (msg) {
    var startTime = now();
    msg.channel.sendMessage("Info").catch(console.error);
  },
};
