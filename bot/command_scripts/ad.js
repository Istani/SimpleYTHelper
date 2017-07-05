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
    var SQL = "SELECT * FROM user_ads ORDER BY count LIMIT 1";
    mysql.query(SQL, function (err, rows) {
      if (err != null) {
        console.log(SQL);
        console.log(err);
        return;
      }
      for (var i = 0; i<rows.length;i++) {
        var SQL2 = "SELECT * FROM user_ads WHERE count='"+rows[i].count+"' ORDER BY Rand() LIMIT 1";
        mysql.query(SQL2, function (err2, rows2) {
          if (err2 != null) {
            console.log(SQL2);
            console.log(err2);
            return;
          }
          for (var j = 0; j<rows2.length;j++) {
            var SQL3 = "UPDATE user_ads SET count=count+1 WHERE link='"+rows2[j].link+"'";
            mysql.query(SQL3, function (err3, rows3) {
              if (err3 != null) {
                console.log(SQL3);
                console.log(err3);
                return;
              }
            });
            var ReturnString="(AD) ";
            var RowString="";
            RowString=rows2[j].title;
            RowString+=": ";
            RowString+=rows2[j].link;
            RowString+="\r\n";
            ReturnString+=RowString;
            SendFunc(ReturnString);
          }
        });
      }
    });
  }
};
