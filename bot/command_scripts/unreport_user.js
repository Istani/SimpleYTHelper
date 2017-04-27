var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  check_permission: function (message_row, SendFunc, NewMessageFunc) {
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
            if (rows2[i].recht_report_user==1) {
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
    time = moment();
    var returnmsg="";
    var parts=message_row.message.split(" ");
    var user=message_row.message.split(" ").slice(1).join(" ").split(":")[0];
    var grund=message_row.message.split(":").slice(1).join(" ");
    var SQL = "";
    var FELDER_UPDATE="service='" + message_row.service + "', host='" + message_row.host + "', name='"+user+"'";
    var FELDER_WHERE="service='" + message_row.service + "' and host='" + message_row.host + "' and name='"+user+"'";
    SQL = "SELECT * FROM bot_chatuser WHERE "+FELDER_WHERE + " LIMIT 1";
    mysql.query(SQL, function (err, rows) {
      if (err != null) {
        console.log(SQL);
        console.log(err);
        return;
      }
      if (rows.length==0) {
        SendFunc("User mit den Namen " + user + " nicht gefunden!");
      } else {
        for (var i = 0; i < rows.length; i++) {
          var tmp_row=rows[i];
          if (tmp_row.is_bot==1) {
            var FELDER_WHERE2="service='" + message_row.service + "' and host='" + message_row.host + "' and user='"+message_row.user+"'";
            var SQL2 = "SELECT * FROM bot_chatuser WHERE "+FELDER_WHERE2 + " LIMIT 1";
            mysql.query(SQL2, function (err, rowsnew) {
              if (err != null) {
                console.log(SQL);
                console.log(err);
                return;
              }
              if (rowsnew.length==0) {
                return;
              } else {
                NewMessageFunc(message_row.service, message_row.host, message_row.room, message_row.id+1, 0, "-1", "!report_user "+rowsnew[0].name+" : Bots verwarnen ist nicht okay!");
                return;
              }
            });
            return;
          } else {
            var Check_Channel="SELECT * FROM bot_chathosts WHERE service='"+message_row.service+"' AND host='"+message_row.host+"' LIMIT 1";
            mysql.query(Check_Channel, function (err3, rows3) {
              if (err3 != null) {
                console.log(Check_Channel);
                console.log(err3);
                return;
              }
              var msg_ok=false;
              if (rows3[0].channel_report!="") {
                if (rows3[0].channel_report==message_row.room) {
                  msg_ok=true;
                }
              } else {
                msg_ok=true;
              }
              
              if (msg_ok==false) {
                NewMessageFunc(message_row.service, message_row.host, rows3[0].channel_report, message_row.id+1, 0, "-1", message_row.message);
                return;
              }
              if (tmp_row.verwarnung<=0) {
                tmp_row.verwarnung=1;
              }
              FELDER_UPDATE=FELDER_UPDATE+", verwarnung="+(tmp_row.verwarnung-1);
              FELDER_UPDATE=FELDER_UPDATE+", verwarnung_zeit="+time;
              
              SQL = "UPDATE bot_chatuser SET " + FELDER_UPDATE +" WHERE "+FELDER_WHERE + " LIMIT 1";
              mysql.query(SQL, function (err2, rows2) {
                if (err2 != null) {
                  console.log(SQL);
                  console.log(err2);
                  return;
                }
                var user_mention=tmp_row.user;
                if (message_row.service=="Discord") {
                  user_mention="<@" + tmp_row.user +">";
                }
                //if (tmp_row.verwarnung<=1) {
                SendFunc("ENTWARNUNG: " + user_mention +" (Score: "+(tmp_row.verwarnung-1)+")\r\n"+grund);
                //} else {
                //  SendFunc("Hier sollte ein Bann für eine gewisse Zeit passieren: " + user_mention +"\r\n"+grund);
                //}
              });
            });
          }
        }
      }
    });
    
  }
};
var mysql=null;
moment=require("moment");
