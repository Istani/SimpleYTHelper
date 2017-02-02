var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    var returnmsg="";
    var parts=message_row.message.split(" ");
    var SQL = "";
    var FELDER="service='" + message_row.service + "', host='" + message_row.host + "', name='"+parts[1]+"'";
    SQL = "SELECT * FROM bot_chatuser WHERE "+FELDER.replace(", ", " and ") + " LIMIT 1";
    mysql.query(SQL, function (err, rows) {
      if (err != null) {
        console.log(SQL);
        console.log(err);
        return;
      }
      if (rows.length==0) {
        SendFunc("User mit den Namen " + parts[1] + " nicht gefunden!");
        return;
      }
      for (var i = 0; i < rows.length; i++) {
        FELDER=FELDER+", verwarnung="+(rows[i].verwarnung+1);
        SQL = "UPDATE bot_chatuser SET " + FELDER +" WHERE "+FELDER.replace(", ", " and ");
        mysql.query(SQL, function (err2, rows2) {
          if (err2 != null) {
            console.log(SQL);
            console.log(err2);
            return;
          }
          var user_mention=rows[i].user;
          if (message_row.service=="Discord") {
            user_mention="<@" + rows[i].user +">";
          }
          if (rows[i].verwarnung<=1) {
            SendFunc("VERWARNUNG: " + user_mention);
          } else {
            SendFunc("Hier sollte ein Bann für eine gewisse Zeit passieren: " + user_mention);
          }
        });
      }
    });
  }
};
var mysql=null;
