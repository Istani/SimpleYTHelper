var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
    Load_RPG_Settings();
  },
  check_permission: function (message_row, SendFunc, NewMessageFunc) {
    var permissions=false;
    
    if (message_row.user=="181794097726619648") {
      permissions=true;
    }
    
    if (message_row.user=="202892723420659714") {
      permissions=true;
    }
    
    if (permissions==false) {
      SendFunc(message_row.user+ " du hast keine Rechte den Befehl auszuführen!\r\n" + message_row.message);
    } else {
      Load_RPG_Settings();
      self.execute(message_row, SendFunc, NewMessageFunc);
    }
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    var amount=0;
    var params=message_row.message.split(" ");
    
    if (typeof params[1]=="undefined") { // 0 ist der befehl selbst!
      params[1]=="start";
    }
    
    switch (params[1]) {
      case 'settings':
      SendFunc(settings['money_per_day']);
      break;
      default:
      
    }
    
  }
};
var settings;
var mysql=null;

function Load_RPG_Settings() {
  var SQL = "SELECT * FROM rpg_settings LIMIT 1";
  mysql.query(SQL, function (err, rows) {
    if (err != null) {
      console.log(SQL);
      console.log(err);
      return;
    }
    for (var i = 0; i<rows.length;i++) {
      settings.{rows[i].name]}=rows[i].value;
    }
  });
};
