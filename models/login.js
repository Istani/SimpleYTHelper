const db = require('../db.js');

var login = {};

login.get_login = function (return_data, done_callback, login_data) {
  try {
    db.query("SELECT * FROM simpleyth_login WHERE email=? AND password=?", [login_data.email, login_data.password], function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      if (result.length == 0) {
        done_callback(err);
        return;
      }
      return_data.login = result[0];
      done_callback();
    });
  } catch (err) {
    done_callback(err);
    console.log("Error", err);
    return;
  }
};
login.register_new = function (return_data, done_callback, register_data) {
  try {
    // TODO: Mehr Felder!
    console.log("REGISTER NEW DATA:", register_data);
    if (register_data.password_repeat != register_data.password) {
      done_callback(err);
      return;
    }
    console.log("Bevor SQL");
    db.query("INSERT INTO simpleyth_login (email, password) VALUES (?, ?)", [register_data.email, register_data.password], function (err, result) {
      console.log("After SQL");
      if (err) {
        done_callback(err);
        return;
      }
      return_data.register = true;
      done_callback();
    });
  } catch (err) {
    done_callback(err);
    console.log("Error", err);
    return;
  }
}

module.exports = login; 