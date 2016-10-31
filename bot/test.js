var sqlite3 = require('sqlite3');
var data = new sqlite3.Database('../data/UC5DOhI70dI3PnLPMkUsosgw.sqlite3');


const google_api_access =require('../token/bot.access.json');
//const google_api_refresh=require('../token/bot.refresh');
const private_settings  =require('./private_settings.json');


var Google = require("./scripts/google_scripts.js");
Google.client(private_settings.google_clientid,private_settings.google_clientscret,google_api_access.access_token);


// Other Vars
var command_prefix = "!";
var time=0;
var log_new_reconnect=false;

// Import Commands?
var cmd=require("./command_scripts/commands.js");
cmd.reload_commands();

// Check for Text
function check_livestream() {
  var SQL_STRING = "SELECT id, displayMessage FROM livestream_chat WHERE ignore = '0' ORDER BY publishedAt LIMIT 1";
  data.all(SQL_STRING, function (err, rows) {
    if (err != null) {
      console.log ("SQLite: " + err);
    }
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var SQL_UPDATE ="UPDATE livestream_chat SET ignore='1' WHERE id='" + row.id + "'";
      data.exec(SQL_UPDATE, function (err, row) {
        if (err != null) {
          console.log ("SQLite: " + err);
        }
      });
      console.log(row.displayMessage);
    }
  });
  setTimeout(check_livestream,500);
}
check_livestream();
