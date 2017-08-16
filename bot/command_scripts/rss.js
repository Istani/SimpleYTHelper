var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  check_permission: function (message_row, SendFunc, NewMessageFunc) {
    var permissions=false;
    var permissions=false;
    
    if (message_row.user=="-1") {
      permissions=true;
    }
    var GET_ROLES="SELECT * FROM bot_chatuser_roles WHERE service='"+message_row.service+"' AND host='"+message_row.host+"' AND user='"+message_row.user+"'";
    mysql.query(GET_ROLES, function (err, rows) {
      if (err != null) {
        console.log(GET_ROLES);
        console.log(err);
        return;
      }
      var WHERE_ROLES="(service='"+message_row.service+"' AND host='"+message_row.host+"')";
      if (rows.length>0) {
        WHERE_ROLES=WHERE_ROLES+" AND (";
        for (var i = 0; i<rows.length;i++) {
          if (i>0) {
            WHERE_ROLES=WHERE_ROLES+" OR ";
          }
          WHERE_ROLES=WHERE_ROLES+"role='"+rows[i].role+"'";
        }
        WHERE_ROLES=WHERE_ROLES+")";
      }
      
      var GET_PERMISSION="SELECT * FROM bot_chatroles WHERE "+WHERE_ROLES;
      mysql.query(GET_PERMISSION, function (err2, rows2) {
        if (err2 != null) {
          console.log(GET_PERMISSION);
          console.log(err2);
        }
        if (typeof rows2!=="undefined") {
          for (var i = 0; i<rows2.length;i++) {
            if (rows2[i].recht_change_rss==1) {
              permissions=true;
            }
          }
        }
        
        if (permissions==false) {
          SendFunc(message_row.user+ " du hast keine Rechte den Befehl auszuführen!\r\n" + message_row.message);
        } else {
          self.execute(message_row, SendFunc, NewMessageFunc);
        }
      });
    });
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    // DO Magic - Ausgabe RSS
  },
};

var mysql=null;
