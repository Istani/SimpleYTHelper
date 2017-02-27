var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    var parts=message_row.message.split(" ");
    var channel=parts[2].replace("<#","");
    channel=channel.replace(">","");
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
      if (rows[0].owner==message_row.user) {
        switch (parts[1]) {
          case 'shame':
          FELDER_UPDATE=FELDER_UPDATE+",channel_report='"+channel+"'";
          break;
          default:
          var output="Diese Channel Art gibt es nicht!\r\n";
          output=output+"Mögliche Channel:\r\n";
          output=output+"- shame\r\n";
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
          SendFunc(parts[1] + " channel wurde bearteitet");
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
