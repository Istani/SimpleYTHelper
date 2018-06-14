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
    var string="Hallo, ich bin der Simple YouTubeHelper Bot!\r\n";
    string=string+"Hier folgt ein Info Text!\r\n";
    SendFunc(string);
    string="";
    string=string+"Homepage: http://s.defender833.de\n\r";
    SendFunc(string);
    string="";
    string=string+"Discord Server zum Bot: https://discord.gg/BtKf23Q\n\r";
    SendFunc(string);
    string="";
    string=string+"Invite: https://discordapp.com/oauth2/authorize?client_id=225365144497029125&scope=bot&permissions=-1\n\r";
    SendFunc(string);
    string="";
  },
};
