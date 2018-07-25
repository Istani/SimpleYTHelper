const db = require('../db.js');

var games = {};

games.get_name = function (name) {
  var reg_exname = name.replace(/ /gi, "_");
  reg_exname = reg_exname.replace(/[\W]+/gi, "");

  console.log("Games","Normal:", name, "Change:", reg_exname);
  return reg_exname;
}

games.import_details = function (return_data, done_callback, write_data) {
  try {
      db.query("SELECT * FROM game_overview WHERE email=?", [login_data.email], function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      if (result.length == 0) {
        //Up_Fail(login_data.email);
        done_callback(err);
        return;
      }
      //Up_Login(login_data.email);
      return_data.login = result[0];
      done_callback();
    });
    */
  } catch (err) {
    done_callback(err);
    console.log("Error", err);
    return;
  }
};

module.exports = games; 