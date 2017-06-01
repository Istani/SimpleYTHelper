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
    var SELECT="SELECT * FROM  `bot_chatuser`";
    var WHERE="(service='"+message_row.service+"' AND host='"+message_row.host+"')";
    
    var SQL=SELECT+" WHERE "+WHERE+" ORDER BY msg_avg DESC LIMIT 0,5";
    mysql.query(SQL, function (err, rows) {
      if (err != null) {
        console.log(SQL);
        console.log(err);
        return;
      }
      var string="";
      string=string+"TOP LIST:\r\n";
      if (rows.length==0) {
        SendFunc("Noch keine Statsitk erstellt. Versuch es morgen nochmal");
      } else {
        for (var i = 0; i < rows.length; i++) {
          string=string+(i+1)+". ";
          string=string+rows[i].name;
          string=string+"  AVG:";
          string=string+rows[i].msg_avg;
          string=string+"  SUM:";
          string=string+rows[i].msg_sum;
          string=string+"\r\n";
        }
        SendFunc(string);
      }
    })
  },
};
