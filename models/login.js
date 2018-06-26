const db = require('../db.js');

var login = {};

login.getLogin = function (username, passwort, done) {
  try {
    var result = db.query("SELECT * FROM simpleyth_login WHERE email=?", username);
    done(null);
    return result;
  } catch (err) {
    console.log("Error", err);
    return;
  }
};

module.exports = login;