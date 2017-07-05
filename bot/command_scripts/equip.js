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
    var SQL = "SELECT * FROM user_ads WHERE type NOT LIKE 'AD' AND link NOT LIKE ''";
    mysql.query(SQL, function (err, rows) {
      if (err != null) {
        console.log(SQL);
        console.log(err);
        return;
      }
      var ReturnString="(AD)\r\n";
      for (var i = 0; i<rows.length;i++) {
        if (rows[i].link!="") {
          var RowString="";
          RowString=rows[i].type;
          RowString+=": ";
          RowString+=rows[i].link;
          RowString+="\r\n";
          if (ReturnString.length+RowString.length>=200) {
            SendFunc(ReturnString);
            ReturnString="";
          }
          ReturnString+=RowString;
        }
      }
      if (ReturnString.length>7) {
        SendFunc(ReturnString);
        ReturnString="";
      }
    });
  }
};
