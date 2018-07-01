const db = require('../db.js');

var login = {};

login.check_login = function (return_data, done_callback, login_data) {
  try {
    db.query("SELECT * FROM simpleyth_login WHERE email=? AND password=?", [login_data.email, login_data.password], function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      if (result.length == 0) {
        Up_Fail(login_data.email);
        return_data.error = {};
        return_data.error.code = "Login";
        return_data.error.text = "Wrong Login Information";
        done_callback(err);
        return;
      }
      Up_Login(login_data.email);
      return_data.login = result[0];
      done_callback();
    });
  } catch (err) {
    done_callback(err);
    console.log("Error", err);
    return;
  }
};
login.get_login = function (return_data, done_callback, login_data) {
  try {
    db.query("SELECT * FROM simpleyth_login WHERE email=?", [login_data.email], function (err, result) {
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

function Up_Login(username) {
  db.query("UPDATE simpleyth_login SET login_count=login_count+1 WHERE email=?", [username], function (err, result) {
    if (err) {
      console.log("Login", err);
      return;
    }
  });
}
function Up_Fail(username) {
  db.query("UPDATE simpleyth_login SET login_fail=login_fail+1 WHERE email=?", [username], function (err, result) {
    if (err) {
      console.log("Login", err);
      return;
    }
  });
}

module.exports = login; 