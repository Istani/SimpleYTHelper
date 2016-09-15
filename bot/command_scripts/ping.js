var now = require('performance-now');
var self = module.exports = {
  ping: function (msg) {
      var startTime = now();
      msg.channel.sendMessage("Ping Started")
      .then(message => {
        var endTime = now();
        return message.edit(`Ping: ${(endTime - startTime).toFixed(0)} ms!`);
      }).catch(console.error);
  },
};
