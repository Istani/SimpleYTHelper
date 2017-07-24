

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
    var query=message_row.message.split(" ").slice(1).join(" ");
    googleapis.discover('customsearch', 'v1').execute(function(err, client) {
      client.search.cse.list({ q: query }).execute(console.log);
    });
  }
};

var mysql=null;
var googleapis = require('googleapis');
