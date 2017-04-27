var global_cooldown=100*60*100; // in 100 Minuten = 10*60*100 ?
var global_lastuse=0;
var global_max=3;

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
    var amount=0;
    var tmp_para=message_row.message.split(" ");
    if (typeof tmp_para[1]=='undefined') {
      amount=1;
    } else {
      if (parseInt(tmp_para[1])>0) {
        amount=parseInt(tmp_para[1]);
      }
    }
    if (global_lastuse+global_cooldown>=Date.now()) {
      SendFunc("Zuviel Party hintereinander!\r\nDer Bot kann gerade keine Party machen!\r\nWarte doch noch einen Moment!");
      return;
    }
    if (amount>global_max) {
      amount=global_max;
      SendFunc("Maximal " + global_max + " Partys erlaubt!");
    }
    if (message_row.service=="Discord") {
      NewMessageFunc("Discord TTS", message_row.host, message_row.room, message_row.id, message_row.time, message_row.user, "!party "+amount);
      return;
    }
    while (amount>0) {
      global_lastuse=Date.now();
      setTimeout(function () {SendFunc("PARTY @everyone");}, 1000*amount);
      amount=amount-1;
    }
  }
};
