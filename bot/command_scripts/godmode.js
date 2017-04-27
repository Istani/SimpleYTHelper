var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  check_permission: function (message_row, SendFunc, NewMessageFunc) {
    var permissions=false;
    
    if (message_row.user=="-1") {
      permissions=true;
    }
    
    if (message_row.user=="202892723420659714") {
      permissions=true;
    }
    
    if (permissions==false) {
      SendFunc(message_row.user+ " du hast keine Rechte den Befehl auszuführen!\r\n" + message_row.message);
    } else {
      self.execute(message_row, SendFunc, NewMessageFunc);
    }
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    if (message_row.user=="-1") {
      SendFunc("Why do a God need Godmode?");
    } else {
      var msg=message_row.message;
      msg=msg.replace("!godmode ","");
      
      NewMessageFunc(message_row.service, message_row.host, message_row.room, message_row.id, message_row.time, "-1", msg);
      SendFunc(message_row.user+ " godmode activated!");
    }
    
  },
};
