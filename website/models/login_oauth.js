const db = require('../db.js');
var login_oauth = {};

login_oauth.get_services = function (return_data, done_callback) {
  try {
    console.log("List all Services");
    db.query("SELECT * FROM simpleyth_oauth_secrets ORDER BY service", function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      return_data.services = result;
      done_callback();
    });
  } catch (err) {
    done_callback(err);
    console.log("Error", err);
    return;
  }
}
login_oauth.get_oauth_settings = function (return_data, done_callback, temp_service) {
  try {
    console.log("Get Service Details");
    db.query("SELECT * FROM simpleyth_oauth_secrets WHERE service=? ORDER BY service", [temp_service], function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      return_data = result[0];
      console.log(return_data);
      done_callback(null, return_data);
    });
  } catch (err) {
    done_callback(err);
    console.log("Error", err);
    return;
  }
}

login_oauth.get_oauth_user = function (return_data, done_callback, useremail) {
  try {
    console.log("List all Oauth-Services");
    db.query("SELECT * FROM simpleyth_login_token WHERE user=? ORDER BY service", [useremail], function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      return_data.oauth = result;
      done_callback();
    });
  } catch (err) {
    done_callback(err);
    console.log("Error", err);
    return;
  }
}

login_oauth.set_oauth_user = function (return_data, done_callback, data) {
  try {
    console.log("Insert Oauth-Login");
    db.query("INSERT INTO simpleyth_login_token (service, user, access_token, refresh_token) VALUES (?, ?, ?, ?)", [data.service, data.email, data.access, data.refresh], function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      //return_data.oauth = result;
      done_callback();
    });
  } catch (err) {
    done_callback(err);
    console.log("Error", err);
    return;
  }
}
module.exports = login_oauth; 