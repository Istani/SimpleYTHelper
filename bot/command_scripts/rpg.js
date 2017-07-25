var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
    Load_RPG_Settings();
  },
  check_permission: function (message_row, SendFunc, NewMessageFunc) {
    var permissions=false;
    
    if (message_row.user=="-1") {
      permissions=true;
    }
    
    if (message_row.user=="181794097726619648") { // Defender
      permissions=true;
    }
    
    if (message_row.user=="202892723420659714") { // Istani
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
    var permissions=false;
    
    if (typeof params[1]=="undefined") { // 0 ist der befehl selbst!
      params[1]="start";
    }
    
    switch (params[1]) {
      case 'settings':
      /* Aktuell noch doppelt gemoppelt */
      if ((message_row.user=="181794097726619648") || (message_row.user=="-1")) {
        SendFunc(Check_Settings(params[2], params[3]));
      }
      break;
      case 'start':
      SendFunc('Test');
      if ((message_row.user=="181794097726619648") || (message_row.user=="-1")) {
        StartNewIfNotExists(SendFunc);
      } else {
        CheckExists(SendFunc);
      }
      
      break;
      default:
      
    }
    
  }
};
var settings= {};
var mysql=null;

function Load_RPG_Settings() {
  var SQL = "SELECT * FROM rpg_settings";
  mysql.query(SQL, function (err, rows) {
    if (err != null) {
      console.log(SQL);
      console.log(err);
      return;
    }
    for (var i = 0; i<rows.length;i++) {
      settings[rows[i].name]=rows[i].value;
    }
  });
};

function Check_Settings(settings_name, setting_value) {
  var return_value="";
  if (typeof setting_value == "undefined") {
    setting_value="";
  }
  if (typeof settings[settings_name]=="undefined") {
    settings[settings_name]=setting_value;
    var SQL = "INSERT INTO rpg_settings SET name='" + settings_name + "', value='"+setting_value+"'";
    mysql.query(SQL, function (err, rows) {
      if (err != null) {
        console.log(SQL);
        console.log(err);
        return;
      }
      Load_RPG_Settings();
    });
  }
  return_value=settings_name + ": "+settings[settings_name];
  return return_value;
}

function StartNewIfNotExists(SendFunc) {};
function CheckExists(SendFunc) {};
