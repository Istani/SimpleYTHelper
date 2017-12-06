var fetch = require('node-fetch');
//var url = "http://31.172.95.10/SimpleYTH/do.php?command=";
var url = "http://127.0.0.1/SimpleYTH/do.php?command=";

var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  check_permission: function (message_row, SendFunc, NewMessageFunc) {
    var permissions=false;
    
    if (message_row.user=="-1") {
      permissions=true;
    }
    
    permissions=true; // Fake Recht!
    
    if (permissions==false) {
      SendFunc(message_row.user+ " du hast keine Rechte den Befehl auszuführen!\r\n" + message_row.message);
    } else {
      self.execute(message_row, SendFunc, NewMessageFunc);
    }
  },
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
    var tmp_url = url + parameter +"&host="+message_row.host+"&user="+message_row.user+"&param="+parameter2;
    fetch(tmp_url)
    .then(function (response) {
      return response.text();
    }).then( function (text) {
      SendFunc(text);
    });
  },
};
