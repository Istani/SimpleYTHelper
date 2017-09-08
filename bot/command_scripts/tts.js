var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  check_permission: function (message_row, SendFunc, NewMessageFunc) {
    var permissions=false;
    
    if (message_row.user=="-1") {
      permissions=true;
    }
    
//    permissions=true; // Fake Recht!
    
    if (permissions==false) {
      SendFunc(message_row.user+ " du hast keine Rechte den Befehl auszuführen!\r\n" + message_row.message);
    } else {
      self.execute(message_row, SendFunc, NewMessageFunc);
    }
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    if (message_row.service=="Discord") {
      NewMessageFunc("Discord TTS", message_row.host, message_row.room, message_row.id, message_row.time, message_row.user, message_row.message);
      return;
    }
    var parameter2="";
    var tmp_para=message_row.message.split(" ");
    for (var i = 1; i<tmp_para.length;i++) {
      parameter2=parameter2+ " " +tmp_para[i];
    }
    parameter2 = parameter2.trim();
    parameter2 = "<@" + message_row.user +">" + " ruft: "+parameter2;
    SendFunc(parameter2);
  }
};
