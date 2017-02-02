var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    var returnmsg="";
    var SQL = "";
    var parts=message_row.message.split(" ");
    switch (parts[1]) {
      case 'add':
      SQL = "INSERT INTO bot_chatbadword SET service='" + message_row.service + "', host='" + message_row.host + "', word='" + parts[2] +"' ON DUPLICATE KEY UPDATE service='" + message_row.service + "', host='" + message_row.host + "', word='" + parts[2] +"'";
      break;
      case 'delete':
      SQL = "DELETE FROM bot_chatbadword WHERE service='" + message_row.service + "' and host='" + message_row.host + "' and word='" + parts[2] +"'";
      break;
      default:
      returnmsg="wrong usage!";
      SendFunc(returnmsg);
      return;
      break;
    }
    mysql.query(SQL, function (err, rows) {
      if (err != null) {
        console.log(SQL);
        console.log(err);
        return;
      }
      SendFunc("BAD WORD: " + parts[1] + " " + parts[2]);
    });
  }
};
var mysql=null;
