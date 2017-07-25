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
      params[1]="info";
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
          if ((message_row.user==HOST_OWNER) || (message_row.user=="-1")) {
            SendFunc(Check_Settings(params[2], params[3]));
            break;
          }
          case 'start':
          if ((message_row.user==HOST_OWNER) || (message_row.user=="-1")) {
            StartNew(SendFunc, HOST_USER.hash);
            break;
          }
          case 'spawn':
          if ((message_row.user==HOST_OWNER) || (message_row.user=="-1")) {
            SpawnMonster(SendFunc,HOST_USER.hash, param[2]);
            break;
          }
          default:
          CheckExists(SendFunc, HOST_USER.hash);
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
  return_value=settings[settings_name];
  return return_value;
}

function StartNew(SendFunc, Hash) {
  SendFunc('START New RPG');
  var ADD_GAME="REPLACE INTO rpg_check SET " +
  "game_id='"+GameID+"', " +
  "state=0";
  mysql.query(ADD_GAME, function (err, check_monster_rows) {
    if (err != null) {
      console.log(CHECK_MONSTER);
      console.log(err);
      return;
    }
  });
  console.log(Hash);
};
function CheckExists(SendFunc, GameID) {
  SendFunc('CHECK RPG! - Coming soon!');
};
function SpawnMonster(SendFunc,GameID, Rounds) {
  if (typeof Rounds=="undefined") {
    Rounds=Check_Settings('default_rounds', 0);
  }
  // Find Data for New Monster?!?
  
  var ADD_MONSTER="UPDATE rpg_check SET state=2 WHERE game_id='"+GameID+"' AND state=1";
  mysql.query(ADD_MONSTER, function (err, check_monster_rows) {
    if (err != null) {
      console.log(CHECK_MONSTER);
      console.log(err);
      return;
    }
    if (check_monster_rows.length==0) {
      SendFunc("RGP-State Wrong! - Start it again!");
    } else {
      SendFunc('Spawn Monster - Coming soon!');
    }
  });
}
