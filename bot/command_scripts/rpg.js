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
            SpawnMonster(SendFunc,HOST_USER.hash, params[2]);
            break;
          }
          case 'anmeldung':
          if ((message_row.user=="-1")) {
            SendFunc("Defender Army - Anwesenheitskontrolle!\r\nGebt ein: !rpg register\r\nUm euch für unseren Kampf zu registrieren!");
            break;
          }
          case 'result':
          if ((message_row.user=="-1")) {
            CheckResult(SendFunc,HOST_USER.hash);
            break;
          }
          break;
          
          case 'howto':
          SendFunc("Ihr habt einen Angriff pro Runde!\r\nEure Stärke basiert auf eure Aktivität in der Army!\r\nEntweder ihr besiegt das Monster oder es schafft die Flucht!\r\n!rpg attack - Um das Monster Anzugreifen!");
          break;
          case 'register':
          CheckRegister(SendFunc, HOST_USER.hash, message_row);
          break;
          case 'round':
          CheckRound(SendFunc, HOST_USER.hash);
          break;
          case 'attack':
          CheckAttack(SendFunc, HOST_USER.hash, message_row.user);
          break;
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

function StartNew(SendFunc, GameID) {
  //SendFunc('START New RPG');
  var ADD_GAME="REPLACE INTO rpg_check SET " +
  "game_id='"+GameID+"', " +
  "game_state=0";
  mysql.query(ADD_GAME, function (err, check_monster_rows) {
    if (err != null) {
      console.log(ADD_GAME);
      console.log(err);
      return;
    }
  });
  SendFunc('Ein neuer Tag beginnt und nichts hat sich geändert!');
};
function CheckExists(SendFunc, GameID) {
  SendFunc('Coming soon! - Need right Parameter at the Moment');
};
function SpawnMonster(SendFunc,GameID, Rounds) {
  if (typeof Rounds=="undefined") {
    Rounds=Check_Settings('default_rounds', 0);
  }
  var CHECK_STATE="SELECT * FROM rpg_check WHERE game_id='"+GameID+"'";
  mysql.query(CHECK_STATE, function (err, check_state_rows) {
    if (err != null) {
      console.log(CHECK_STATE);
      console.log(err);
      return;
    }
    if (check_state_rows.length>=1) {
      if (check_state_rows[0].game_state==1) {
        var ADD_MONSTER="UPDATE rpg_check SET game_state=2, rounds_max="+Rounds+" WHERE game_id='"+GameID+"'";
        mysql.query(ADD_MONSTER, function (err, check_monster_rows) {
          if (err != null) {
            console.log(ADD_MONSTER);
            console.log(err);
            return;
          }
        });
      } else {
        SendFunc("Wrong Game State ("+check_state_rows[0].game_state+")! - !rpg start - To Restart the Game");
      }
    } else {
      SendFunc('No Game found!');
    }
  });
}
function CheckRegister(SendFunc, GameID, message_row) {
  var UserID=message_row.user;
  var CHECK_STATE="SELECT * FROM rpg_check WHERE game_id='"+GameID+"'";
  mysql.query(CHECK_STATE, function (err, check_state_rows) {
    if (err != null) {
      console.log(CHECK_STATE);
      console.log(err);
      return;
    }
    if (check_state_rows.length>=1) {
      if (check_state_rows[0].game_state==3) {
        // Check Player Werte...
        
        var FELDER_WHERE2="service='" + message_row.service + "' and host='" + message_row.host + "' and user='"+message_row.user+"'";
        var CHECK_USER = "SELECT * FROM bot_chatuser WHERE "+FELDER_WHERE2 + " LIMIT 1";
        mysql.query(CHECK_USER, function (err, check_player_row) {
          if (err != null) {
            console.log(CHECK_USER);
            console.log(err);
            return;
          }
          var USER_AVG=check_player_row[0].msg_avg;
          var USER_NAME=check_player_row[0].name;
          var ADD_PLAYER="INSERT INTO rpg_player SET game_id='"+GameID+"', user_id='"+UserID+"', user_name='"+USER_NAME+"', calculate_avg='"+(USER_AVG+5)+"'";
          mysql.query(ADD_PLAYER, function (err, check_monster_rows) {
            if (err != null) {
              console.log(ADD_PLAYER);
              console.log(err);
              return;
            }
          });
        });
      } else {
        if (check_state_rows[0].game_state>=4) {
          SendFunc(UserID +": Rekrut ihr seid zu spät zur Anmeldung!");
        } else {
          SendFunc("Keine Anmeldung möglich!");
        }
      }
    } else {
      SendFunc('No Game found!');
    }
  });
}
function CheckRound(SendFunc, GameID) {
  var CHECK_STATE="SELECT * FROM rpg_check WHERE game_id='"+GameID+"'";
  mysql.query(CHECK_STATE, function (err, check_state_rows) {
    if (err != null) {
      console.log(CHECK_STATE);
      console.log(err);
      return;
    }
    if (check_state_rows.length>=1) {
      if (check_state_rows[0].game_state==4) {
        SendFunc("Runde: "+check_state_rows[0].rounds_current+"/"+check_state_rows[0].rounds_max+" - "+check_state_rows[0].monster_id+" ("+check_state_rows[0].monster_hp_current+"/"+check_state_rows[0].monster_hp_max+")");
      } else {
        SendFunc("Es findet zur Zeit kein Kampf statt!");
      }
    } else {
      SendFunc('No Game found!');
    }
  });
}
function CheckResult(SendFunc,GameID) {
  var CHECK_STATE="SELECT * FROM rpg_check WHERE game_id='"+GameID+"'";
  mysql.query(CHECK_STATE, function (err, check_state_rows) {
    if (err != null) {
      console.log(CHECK_STATE);
      console.log(err);
      return;
    }
    var CHECK_DMG="SELECT * FROM rpg_player WHERE game_id='"+GameID+"' ORDER BY sum_dmg DESC LIMIT 5";
    mysql.query(CHECK_DMG, function (err, list_player_dmg) {
      if (err != null) {
        console.log(CHECK_STATE);
        console.log(err);
        return;
      }
      var ReturnString="Top 5 - Schaden:\r\n";
      for (var i = 0; i<list_player_dmg.length;i++) {
        var RowString="";
        RowString+=list_player_dmg[i].user_name+": "+list_player_dmg[i].sum_dmg;
        RowString+="\r\n";
        if (ReturnString.length+RowString.length>=200) {
          SendFunc(ReturnString);
          ReturnString="";
        }
        ReturnString+=RowString;
      }
      if (ReturnString.length>7) {
        SendFunc(ReturnString);
        ReturnString="";
      }
    });
    if (check_state_rows[0].monster_hp_current<=0) {
      SendFunc("Ihr habt das Monster besiegt! Das nächste mal wird es sich besser vorbereiten!");
    } else {
      SendFunc("Ihr habt zugelassen das des Monster weiterzieht! Das nächste mal sieht es euch weniger als Bedrohung!");
    }
  });
}
function CheckAttack(SendFunc, GameID, UserID) {
  var CHECK_STATE="SELECT * FROM rpg_check WHERE game_id='"+GameID+"'";
  mysql.query(CHECK_STATE, function (err, check_state_rows) {
    if (err != null) {
      console.log(CHECK_STATE);
      console.log(err);
      return;
    }
    if (check_state_rows.length>=1) {
      if (check_state_rows[0].game_state==4) {
        var ADD_PLAYER="INSERT INTO rpg_player_attack SET game_id='"+GameID+"', user_id='"+UserID+"'";
        mysql.query(ADD_PLAYER, function (err, check_monster_rows) {
          if (err != null) {
            console.log(ADD_PLAYER);
            console.log(err);
            return;
          }
        });
      } else {
        if (check_state_rows[0].game_state>=5) {
          SendFunc("Der Kampf ist vorbei!");
        } else {
          SendFunc("Der Kampf hat noch nicht begonnen!");
        }
      }
    } else {
      SendFunc('No Game found!');
    }
  });
}
