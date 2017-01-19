var mysql = require("mysql");
const private_settings  =require('./private_settings.json');

var connection = mysql.createConnection({
  host     : private_settings.mysql_host,
  user     : private_settings.mysql_user,
  password : private_settings.mysql_pass,
  database : private_settings.mysql_base
});

connection.connect();
var repeat_google_check=true;
function Google_CheckMessage() {
  console.log("Check");
  var SQL_STRING = "SELECT id, displayMessage FROM livestream_chat WHERE `ignore` = '0' ORDER BY publishedAt LIMIT 1";
  connection.query(SQL_STRING, function (err, rows) {
    if (err != null) {
      console.log("SQLite: " + err);
      repeat_google_check=false;
    }
    for (var i = 0; i < rows.length; i++) {
      
      console.log("Test Read: "+ rows[i].displayMessage);
    }
  });
  if (repeat_google_check) {
    setTimeout(Google_CheckMessage,100);
  }
}
Google_CheckMessage();
