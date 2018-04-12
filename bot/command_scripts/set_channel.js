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
    var parts=message_row.message.split(" ");
    
    var channel="";
    if (typeof parts[2]!=="undefined") {
      channel=parts[2].replace("<#","");
      channel=channel.replace(">","");
    }
    
    var SQL = "";
    var FELDER_WHERE="service='" + message_row.service + "' and host='" + message_row.host + "'";
    var FELDER_UPDATE="service='" + message_row.service + "', host='" + message_row.host + "'";
    SQL = "SELECT * FROM bot_chathosts WHERE "+FELDER_WHERE + " LIMIT 1";
    mysql.query(SQL, function (err, rows) {
      if (err != null) {
        console.log(SQL);
        console.log(err);
        return;
      }
      if ((rows[0].owner==message_row.user) || (message_row.user=="-1")) {
        switch (parts[1]) {
          case 'shame':
          FELDER_UPDATE=FELDER_UPDATE+",channel_report='"+channel+"'";
          break;
          case 'video':
          FELDER_UPDATE=FELDER_UPDATE+",channel_video='"+channel+"'";
          break;
          case 'rpg':
          FELDER_UPDATE=FELDER_UPDATE+",channel_rpgmain='"+channel+"'";
          break;
          case 'rss':
          FELDER_UPDATE=FELDER_UPDATE+",channel_rss='"+channel+"'";
          break;
          case 'humble':
          FELDER_UPDATE=FELDER_UPDATE+",channel_humble='"+channel+"'";
          break;
          case 'community':
          FELDER_UPDATE=FELDER_UPDATE+",channel_community='"+channel+"'";
          break;
          default:
          var output="Diese Channel Art gibt es nicht!\r\n";
          output=output+"Mögliche Channel:\r\n";
          output=output+"- shame\r\n";
          output=output+"- video\r\n";
          output=output+"- humble\r\n";
          output=output+"- community\r\n";
          output=output+"- rpg (beta)\r\n";
          output=output+"- rss\r\n";
          SendFunc(output);
          return;
        }
        SQL_UPDATE="UPDATE bot_chathosts SET "+FELDER_UPDATE+" WHERE " + FELDER_WHERE + " LIMIT 1";
        mysql.query(SQL_UPDATE, function (err, rows) {
          if (err != null) {
            console.log(SQL);
            console.log(err);
            return;
          }
          SendFunc(parts[1] + " channel wurde bearbeitet");
          return;
        });
      } else {
        SendFunc("Nur der Owner darf Channels bestimmen!");
        return;
      }
    });
  }
};
var mysql=null;
