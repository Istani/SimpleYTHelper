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
    
    permissions=true; // Fake Permission
    
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
    
    // Get Owner
    var SQL_GET_OWNER="SELECT owner FROM bot_chathosts WHERE service='"+message_row.service+"' AND host='"+message_row.host+"'";
    mysql.query(SQL_GET_OWNER, function (err, rows) {
      if (err != null) {
        console.log(SQL_GET_OWNER);
        console.log(err);
        return;
      }
      for (var i = 0; i < rows.length; i++) {
        var HOST_OWNER=rows[i].owner;
      }
      // Get SimpleYTH User Hash
      var SQL_GET_USER="SELECT *, MD5(email) as hash FROM user WHERE youtube_user='"+HOST_OWNER+"' OR discord_user='"+HOST_OWNER+"'";
      mysql.query(SQL_GET_USER, function (err2, rows2) {
        if (err != null) {
          console.log(SQL_GET_USER);
          console.log(err);
          return;
        }
        for (var i = 0; i < rows.length; i++) {
          var HOST_USER=rows2[i];
        }
        // Do Magic
        switch (params[1]) {
          case 'settings':
          /* Aktuell noch doppelt gemoppelt */
          if ((message_row.user==HOST_OWNER) || (message_row.user=="-1")) {
            SendFunc(Check_Settings(params[2], params[3]));
          }
          break;
          case 'start':
          if ((message_row.user==HOST_OWNER) || (message_row.user=="-1")) {
            SendFunc('Hier würde eine neue RPG-Zone Starten - Gibt es noch nicht!');
            StartNewIfNotExists(SendFunc);
          } else {
            SendFunc('Hier würde der Info Text der RPG-Zone Stehen - Gibt es noch nicht!');
            CheckExists(SendFunc);
          }
          
          break;
          default:
        }
      });
    });
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
