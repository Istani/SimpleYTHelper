var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    time = moment();
    console.log(message_row);
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
            FELDER_UPDATE=FELDER_UPDATE+", verwarnung="+(tmp_row.verwarnung+1);
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
              SendFunc("VERWARNUNG: " + user_mention +"\r\n"+grund);
              //} else {
              //  SendFunc("Hier sollte ein Bann für eine gewisse Zeit passieren: " + user_mention +"\r\n"+grund);
              //}
            });
          }
        }
      }
    });
    
  }
};
var mysql=null;
moment=require("moment");
