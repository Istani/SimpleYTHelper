const db = require('../db.js');

var games = {};

games.get_name = function (name) {
  var reg_exname = name.replace(/ /gi, "_");
  reg_exname = reg_exname.replace(/[\W]+/gi, "");

  //console.log("Games", "Normal:", name, "Change:", reg_exname);
  return reg_exname;
}

games.import_details = function (return_data, done_callback, write_data) {
  try {
    db.query("SELECT * FROM game_overview WHERE name=?", [write_data.name], function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      if (result.length == 0) {
        if ((typeof write_data.type == undefined) || (write_data.type == "")) {
          write_data.type = "Unknown";
        }
        if (typeof write_data.description == undefined) {
          write_data.description = "";
        }
        if (typeof write_data.banner == undefined) {
          write_data.banner = "";
        }
        db.query("INSERT INTO game_overview SET type=?, description=?, banner=?, name=?, display_name=?", [write_data.type, write_data.description, write_data.banner, write_data.name, write_data.display_name], function (err, result) {
          if (err) {
            done_callback(err);
            return;
          }
          done_callback();
          return;
        });
      }
      db.query("UPDATE game_overview SET type=?, description=?, banner=? WHERE name=?", [write_data.type, write_data.description, write_data.banner, write_data.name], function (err, result) {
        if (err) {
          done_callback(err);
          return;
        }
        done_callback();
        return;
      });
    });
  } catch (err) {
    done_callback(err);
    console.log("Error", err);
    return;
  }
};

games.import_store_links = function (return_data, done_callback, write_data) {
  try {
    db.query("SELECT * FROM game_link WHERE store=? AND name=?", [write_data.store, write_data.name], function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      if (result.length == 0) {
        db.query("INSERT INTO game_link SET link=?, price=?, discount=?, store=?, name=?", [write_data.link, write_data.price, write_data.discount, write_data.store, write_data.name], function (err, result) {
          if (err) {
            done_callback(err);
            return;
          }
          done_callback();
          return;
        });
      }
      db.query("UPDATE game_link SET link=?, price=?, discount=? WHERE store=? AND name=?", [write_data.link, write_data.price, write_data.discount, write_data.store, write_data.name], function (err, result) {
        if (err) {
          done_callback(err);
          return;
        }
        done_callback();
        return;
      });
    });
  } catch (err) {
    done_callback(err);
    console.log("Error", err);
    return;
  }
};

games.delete_game_and_links_BYTYPE = function (return_data, done_callback, write_data) {
  try {
    db.query("DELETE FROM game_overview WHERE type = ?", [write_data.type], function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      db.query("DELETE game_link FROM game_link LEFT JOIN game_overview ON game_link.name=game_overview.name WHERE game_overview.name IS NULL", [], function (err, result) {
        if (err) {
          done_callback(err);
          return;
        }
        done_callback();
      });
    });
  } catch (e) {
    done_callback(e);
  };
}
module.exports = games; 
