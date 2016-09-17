var fetch = require('node-fetch');
var url = "http://defender833.adultdns.net/SimpleYTH/do.php?command=";

var self = module.exports = {
  execute: function (msg) {
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