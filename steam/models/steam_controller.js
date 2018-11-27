const db = require('../db.js');

var games = {};

games.INSERT_UPDATE = function (return_data, done_callback, write_data) {
  try {
    db.query("SELECT * FROM import_steam_controller WHERE appid=?", [write_data.appid], function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      if (result.length == 0) {
        db.query("INSERT INTO import_steam_controller SET  type=?, `ignore`=?, appid=?", [write_data.type, write_data.ignore, write_data.appid], function (err, result) {
          if (err) {
            done_callback(err);
            return;
          }
          done_callback();
          return;
        });
      } else {
        if (write_data.type == "UNKNOWN") {
          db.query("UPDATE import_steam_controller SET updated_at=NOW(), `ignore=0 WHERE appid=?", [write_data.appid], function (err, result) {
            if (err) {
              done_callback(err);
              return;
            }
            done_callback();
            return;
          });
        } else if (result[0].ignore == 1) {
          // Ist das nicht eigentlich unnötig? - Weil dann sollte des ja gar nicht mehr importiert werden?!?
          done_callback();
          return;
        } else {
          db.query("UPDATE import_steam_controller SET type=?, `ignore`=?, updated_at=NOW() WHERE appid=?", [write_data.type, write_data.ignore, write_data.appid], function (err, result) {
            if (err) {
              done_callback(err);
              return;
            }
            done_callback();
            return;
          });
        }
      }
    });
  } catch (err) {
    done_callback(err);
    console.log("Error", err);
    return;
  }
};

games.LIST = function (return_data, done_callback, write_data) {
  try {
    db.query("(SELECT (1) AS x, import_steam_controller.* FROM import_steam_controller WHERE type like ? ORDER BY updated_at) UNION (SELECT (2) AS x, import_steam_controller.* FROM import_steam_controller WHERE `ignore` = 0 AND type not like ? ORDER BY updated_at) ORDER BY x, updated_at", ["UNKNOWN", "UNKNOWN"], function (err, result) {
      if (err) {
        done_callback(null, err);
        return;
      }
      if (result.length == 0) {
        done_callback(null, err);
        return;
      }
      result.forEach(function (row) {
        done_callback(row);
      });
    });
  } catch (err) {
    done_callback(null, err);
    console.error(err);
    return;
  }
};

games.LIST_IGNORE = function (return_data, done_callback, write_data) {
  try {
    db.query("SELECT appid  FROM import_steam_controller WHERE `ignore` = true ORDER BY updated_at", ["UNKNOWN", "UNKNOWN"], function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      if (result.length == 0) {
        done_callback();
        return;
      }
      return_data.apps = result;
      done_callback();
    });
  } catch (e) {
    done_callback(e);
    console.error(e);
  };
};
games.SET_IGNORE = function (return_data, done_callback, write_data) {
  try {
    db.query("UPDATE import_steam_controller SET `ignore` = true WHERE type = ?", [write_data.type], function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      done_callback();
    });
  } catch (e) {
    done_callback(e);
  };
}
module.exports = games; 