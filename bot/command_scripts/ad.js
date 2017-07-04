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
    SendFunc("(AD) https://www.amazon.de/gp/search?ie=UTF8&tag=istani0815-21&linkCode=ur2&linkId=a3e8f2d829517c2a3e066eb65aa5cd5c&camp=1638&creative=6742&index=computers&keywords=Gaming");
    
  }
};
