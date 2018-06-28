const db = require('../db.js');

var login = {};

login.getLogin = function (return_data, done_callback, username, passwort) {
  try {
    db.query("SELECT * FROM simpleyth_login WHERE email=?", username, function (err, result) {
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
    if (register_data.password_repeat != register_data.password) {
      done_callback(err);
      return;
    }
    db.query("INSERT INTO simpleyth_login SET email=?, password=?", register_data.email, register_data.password, function (err, result) {
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