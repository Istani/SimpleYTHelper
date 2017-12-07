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
    var My_Owner="";
    var GET_OWNER="SELECT * FROM bot_chathosts WHERE host='"+message_row.host+"'";
    mysql.query(GET_OWNER, function (oerr, orows) {
      if (orows.length==0) {
        orows[0].owner="202892723420659714";
      }
      for (var num_orows = 0; num_orows<orows.length;num_orows++) {
        var GET_ACCOUNT="SELECT * FROM user WHERE discord_user='"+orows[num_orows].owner+"' or youtube_user='"+orows[num_orows].owner+"'";
        mysql.query(GET_ACCOUNT, function (aerr, arows) {
          if (arows.length==0) {
            //arows[0].email="simpleyth";
          }
          for (var num_arows = 0; num_arows<arows.length;num_arows++) {
            My_Owner=arows[num_arows].email;
            var SQL = "SELECT * FROM user_ads WHERE owner='"+My_Owner+"' AND type NOT LIKE 'Link' AND link NOT LIKE '' ORDER BY count LIMIT 1";
            mysql.query(SQL, function (err, rows) {
              if (err != null) {
                console.log(SQL);
                console.log(err);
                return;
              }
              for (var i = 0; i<rows.length;i++) {
                var SQL2 = "SELECT *, md5(concat(owner,link)) AS hash FROM user_ads WHERE count='"+rows[i].count+"' AND type NOT LIKE 'Link' AND link NOT LIKE '' AND owner='"+My_Owner+"' ORDER BY Rand() LIMIT 1";
                //$url = "http://simpleyth.randompeople.de/l.php?l=".$link['hash'];
                //md5(concat(owner,link)) AS hash
                mysql.query(SQL2, function (err2, rows2) {
                  if (err2 != null) {
                    console.log(SQL2);
                    console.log(err2);
                    return;
                  }
                  for (var j = 0; j<rows2.length;j++) {
                    if (rows2[j].count>=2) {
                      var SQL3 = "UPDATE user_ads SET count=0 WHERE owner='"+rows2[j].owner+"'";
                      mysql.query(SQL3, function (err3, rows3) {
                        if (err3 != null) {
                          console.log(SQL3);
                          console.log(err3);
                          return;
                        }
                      });
                    }
                    var SQL4 = "UPDATE user_ads SET count=count+1 WHERE link='"+rows2[j].link+"'";
                    mysql.query(SQL4, function (err4, rows4) {
                      if (err4 != null) {
                        console.log(SQL4);
                        console.log(err4);
                        return;
                      }
                    });
                    
                    var ReturnString="(AD) ";
                    var RowString="";
                    RowString=rows2[j].title;
                    RowString+=": ";
                    //RowString+="http://simpleyth.randompeople.de/l.php?l=";
                    RowString+="http://s.defender833.de/l.php?l=";
                    RowString+=rows2[j].hash;
                    RowString+="\r\n";
                    ReturnString+=RowString;
                    SendFunc(ReturnString);
                  }
                });
              }
            });
          }
        });
      }
    });
  }
};
