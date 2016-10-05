var fetch = require('node-fetch');
var url = "http://31.172.95.10/SimpleYTH/do.php?command=";

var self = module.exports = {
  execute: function (msg) {
    var parameter = msg.content.split(" ")[1];
    var parameter2="";
    var tmp_para=msg.content.split(" ");
    for (var i = 2; i<tmp_para.length;i++) {
    	parameter2=parameter2+tmp_para[i];
    }
    if (typeof parameter == 'undefined') {
      parameter=null;
    }
    var tmp_url = url + parameter +"&param="+parameter2;
    fetch(tmp_url)
    .then(function (response) {
      return response.text();
    }).then( function (text) {
      msg.channel.sendMessage(text).catch(console.error);
    });
  },
};