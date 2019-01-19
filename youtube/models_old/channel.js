const db = require('../db.js');

var table = {};

table.import_details = function (return_data, done_callback, write_data) {
  try {
    db.query("SELECT * FROM channel WHERE user_id=? AND service=? AND channel_id=?", [write_data.user_id, write_data.service, write_data.channel_id], function (err, result) {
      if (err) {
        done_callback(err);
        return;
      }
      if (result.length == 0) {
        db.query("INSERT INTO channel SET channel_title=?, description=?, start_date=?, thumbnail=?,banner=?, main_playlist=?, views=?, subscriber=?, videos=?, user_id =?, service =?, channel_id =? ",
          [write_data.channel_title,
          write_data.description,
          write_data.start_date,
          write_data.thumbnail,
          write_data.banner,
          write_data.main_playlist,
          write_data.views,
          write_data.subscriber,
          write_data.videos,
          write_data.user_id, write_data.service, write_data.channel_id], function (err, result) {
            if (err) {
              done_callback(err);
              return;
            }
            done_callback();
            return;
          });
      }
      db.query("UPDATE channel SET channel_title=?, description=?, start_date=?, thumbnail=?,banner=?, main_playlist=?, views=?, subscriber=?, videos=? WHERE user_id=? AND service=? AND channel_id=?", [write_data.channel_title,
      write_data.description,
      write_data.start_date,
      write_data.thumbnail,
      write_data.banner,
      write_data.main_playlist,
      write_data.views,
      write_data.subscriber,
      write_data.videos,
      write_data.user_id, write_data.service, write_data.channel_id], function (err, result) {
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

module.exports = table; 