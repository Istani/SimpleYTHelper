var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    time = moment();
    var returnmsg="";
    var parts=message_row.message.split(" ");
    var grund=message_row.message.split(" ").slice(2).join(" ");
    var SQL = "";
    var FELDER_UPDATE="service='" + message_row.service + "', host='" + message_row.host + "', name='"+parts[1]+"'";
    var FELDER_WHERE="service='" + message_row.service + "' and host='" + message_row.host + "' and name='"+parts[1]+"'";;
    SQL = "SELECT * FROM bot_chatuser WHERE "+FELDER_WHERE + " LIMIT 1";
    mysql.query(SQL, function (err, rows) {
      if (err != null) {
        console.log(SQL);
        console.log(err);
        return;
      }
      if (rows.length==0) {
        SendFunc("User mit den Namen " + parts[1] + " nicht gefunden!");
      } else {
        for (var i = 0; i < rows.length; i++) {
          var tmp_row=rows[i];
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
    });
    
  }
};
var mysql=null;
moment=require("moment");
