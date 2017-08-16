var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  check_permission: function (message_row, SendFunc, NewMessageFunc) {
    var permissions=false;
    var permissions=false;
    
    if (message_row.user=="-1") {
      permissions=true;
    }
    var GET_ROLES="SELECT * FROM bot_chatuser_roles WHERE service='"+message_row.service+"' AND host='"+message_row.host+"' AND user='"+message_row.user+"'";
    mysql.query(GET_ROLES, function (err, rows) {
      if (err != null) {
        console.log(GET_ROLES);
        console.log(err);
        return;
      }
      var WHERE_ROLES="(service='"+message_row.service+"' AND host='"+message_row.host+"')";
      if (rows.length>0) {
        WHERE_ROLES=WHERE_ROLES+" AND (";
        for (var i = 0; i<rows.length;i++) {
          if (i>0) {
            WHERE_ROLES=WHERE_ROLES+" OR ";
          }
          WHERE_ROLES=WHERE_ROLES+"role='"+rows[i].role+"'";
        }
        WHERE_ROLES=WHERE_ROLES+")";
      }
      
      var GET_PERMISSION="SELECT * FROM bot_chatroles WHERE "+WHERE_ROLES;
      mysql.query(GET_PERMISSION, function (err2, rows2) {
        if (err2 != null) {
          console.log(GET_PERMISSION);
          console.log(err2);
        }
        if (typeof rows2!=="undefined") {
          for (var i = 0; i<rows2.length;i++) {
            if (rows2[i].recht_change_rss==1) {
              permissions=true;
            }
          }
        }
        
        if (permissions==false) {
          SendFunc(message_row.user+ " du hast keine Rechte den Befehl auszuführen!\r\n" + message_row.message);
        } else {
          self.execute(message_row, SendFunc, NewMessageFunc);
        }
      });
    });
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    var parts=message_row.message.split(" ");
    // The Magic
    if (message_row.user != "-1") {
      // Add
      // TODO: REMOVE
      var ADD_RSS="REPLACE INTO rss_news_source SET service='"+message_row.service+"', host='"+message_row.host+"', src='"+parts[1]+"'";
      mysql.query(ADD_RSS, function (err, check_monster_rows) {
        if (err != null) {
          console.log(ADD_RSS);
          console.log(err);
          return;
        }
        SendFunc(parts[1] + " wurde hinzugefügt!");
      });
    } else {
      // Ausgabe
      var SELECT_RSS="SELECT rss_news.* FROM "+
      "rss_news INNER JOIN rss_news_source ON rss_news.source=rss_news_source.src "+
      "INNER JOIN bot_chathosts ON rss_news_source.service=bot_chathosts.service AND rss_news_source.host=bot_chathosts.host "+
      "WHERE rss_post<rss_news.time AND service='"+message_row.service+"' AND host='"+message_row.host+"' ORDER BY rss_news.time LIMIT 1";
      mysql.query(SELECT_RSS, function (err, check_monster_rows) {
        if (err != null) {
          console.log(SELECT_RSS);
          console.log(err);
          return;
        }
        for (var i = 0; i<check_monster_rows.length;i++) {
          SendFunc(check_monster_rows[i].title + "\r\n" + check_monster_rows[i].link);
          var UPDATE_HOST="UPDATE bot_chathosts SET rss_post="+check_monster_rows[i].time+" WHERE service='"+message_row.service+"' AND host='"+message_row.host+"'";
          mysql.query(UPDATE_HOST, function (err2, x) {
            if (err2 != null) {
              console.log(UPDATE_HOST);
              console.log(err2);
              return;
            }
          });
        }
      });
    }
  },
};

var mysql=null;
