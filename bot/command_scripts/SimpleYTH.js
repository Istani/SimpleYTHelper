var fetch = require('node-fetch');
var url = "https://zod-cod.safe-ws.de/do.php?command=";

var self = module.exports = {
  SimpleYTH: function (msg) {
    var parameter = msg.content.split(" ")[1];
    if (typeof parameter == 'undefined') {
      parameter=null;
    }
    var tmp_url = url + parameter;
    fetch(tmp_url)
    .then(function (response) {
      return response.text();
    }).then( function (text) {
      msg.channel.sendMessage(text).catch(console.error);
    });
  },
};
