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
      SendFunc("Du hast keine Rechte den Befehl auszuführen");
    } else {
      self.execute(message_row, SendFunc, NewMessageFunc);
    }
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    var IstaniUserID='202892723420659714';
    if (message_row.user==IstaniUserID) { // TODO: Implement Permissions
      SendFunc("Shutdown - Trying Reboot!");
      setTimeout(function () {
        process.exit();
      }, 5000);
    } else {
      SendFunc("No Permissions! " + message_row.user);
    }
  },
};
