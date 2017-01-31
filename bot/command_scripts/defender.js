var fetch = require('node-fetch');
var url = "http://31.172.95.10/SimpleYTH/do.php?command=";

var self = module.exports = {
  execute: function (message_row, SendFunc, NewMessageFunc) {
    var parameter = message_row.message.split(" ")[1];
    var parameter2="";
    var tmp_para=message_row.message.split(" ");
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
      SendFunc(text);
    });
  },
};
