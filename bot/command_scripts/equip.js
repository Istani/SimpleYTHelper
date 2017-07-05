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
    var SQL = "SELECT * FROM user_ads WHERE type NOT LIKE 'AD'";
    mysql.query(SQL, function (err, rows) {
      if (err != null) {
        console.log(SQL);
        console.log(err);
        return;
      }
      var ReturnString="(AD)\r\n";
      for (var i = 0; i<rows.length;i++) {
        var RowString="";
        RowString=rows[i].title;
        RowString+=": ";
        RowString+=rows[i].link;
        RowString+="\r\n";
        if (ReturnString.length+RowString.length>=200) {
          SendFunc(ReturnString);
          ReturnString="";
        }
        /*
        if (ReturnString.length==0) {
        ReturnString="(AD)\r\n";
      }
      */
      ReturnString+=RowString;
    }
    if (ReturnString.length>0) {
      SendFunc(ReturnString);
      ReturnString="";
    }
  });
}
};
