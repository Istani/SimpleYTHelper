const db = require('../db.js');

var login = {};

login.getLogin = function (reutrn_data, done_callback, username, passwort, done) {
  try {
    db.query("SELECT * FROM simpleyth_login WHERE email=?", username, function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      reutrn_data.login = result[0];
      done_callback();
    });
  } catch (err) {
    console.log("Error", err);
    return;
  }
};

module.exports = login;