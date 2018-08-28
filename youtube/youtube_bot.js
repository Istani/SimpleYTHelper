const async = require('async');
const db = require("./db.js");
const channel = require("./models/channel.js");
var request = require('request');
var cron = require('node-cron');


var OAuth_Settings = {};
var OAuth_Bot_User = {};

async.parallel([
  function (callback) {
    db.query("SELECT * FROM simpleyth_oauth_secrets WHERE service = 'youtube'", function (err, result) {
      if (err) {
        callback(err);
        return;
      }
      if (result.length == 0) {
        callback("Entry YouTube Missing");
        return;
      }
      OAuth_Settings = result[0];
      callback(err);
    });
  },
  function (callback) {
    db.query("SELECT * FROM simpleyth_oauth_botcredentials WHERE service = 'youtube'", function (err, result) {
      if (err) {
        callback(err);
        return;
      }
      if (result.length == 0) {
        callback("Entry YouTube Missing");
        return;
      }
      OAuth_Bot_User = result[0];
      callback(err);
    });
  }
], function (err) {
  if (err) {
    console.error("ERROR", err);
    process.exit(1);
  }

  db.query("UPDATE simpleyth_login_token SET cronjob=false WHERE service = 'youtube'", function (err, result) {
    // Yeay
    if (err) {
      console.error(err);
      process.exit(1);
    }
    Gen_New_Cronjobs();

  });
  //GetChannel(OAuth_Bot_User);
});

function Gen_New_Cronjobs() {
  db.query("SELECT * FROM simpleyth_login_token WHERE cronjob=false AND service = 'youtube'", function (err, result) {
    if (err) {
      console.error(err);
    } else {
      if (result.length > 0) {
        db.query("UPDATE simpleyth_login_token SET cronjob=true WHERE id=? ", [result[0].id], function (err2, result2) {
          GetChannel(result[0]);  // Einmalig am anfang.

          cron.schedule('0 0 * * *', function () {
            console.log("Cronjob", "GetChannel", result[0].id, result[0].user)
            GetChannel(result[0]);
          });


        });
      }
    }
    setTimeout(Gen_New_Cronjobs, 1000);
  });
};

function Refresh_Token(token_data, org_function) {
  var request_data = {
    "grant_type": "refresh_token",
    "refresh_token": token_data.refresh_token,
    "client_id": OAuth_Settings.client_id,
    "client_secret": OAuth_Settings.client_secret
  };
  request({
    url: OAuth_Settings.url_token,
    method: 'POST',
    auth: {
      'bearer': token_data.access_token,
      'content-type': 'application/x-www-form-urlencoded'
    },
    qs: request_data,
    json: false
  }, function (err, res) {
    if (err) {
      console.error("ERROR", err);
      return;
    }
    var data = JSON.parse(res.body);
    if (typeof data.error !== "undefined") {
      console.error("YOUTUBE", "REFRESH", data.error);
      return;
    }
    token_data.access_token = data.access_token;

    var temp_sql = db.format("UPDATE simpleyth_login_token SET access_token=? WHERE id=?", [token_data.access_token, token_data.id]);
    db.query(temp_sql, function (err, result) {
      if (err) {
        console.error("ERROR", err);
      }
      org_function(token_data);
    });
  });
};

function GetChannel(token_data) {
  async.parallel([
    function (callback) {
      db.query("SELECT * FROM simpleyth_login_token WHERE id=?", [token_data.id], function (err, result) {
        if (err) {
          console.error(err);
        }
        token_data = result[0];
        callback();
      });
    }
  ], function (err) {
    request({
      url: 'https://www.googleapis.com/youtube/v3/channels',
      auth: {
        'bearer': token_data.access_token
      },
      qs: {
        "mine": "true",
        "part": "brandingSettings,contentDetails,snippet,statistics"
      }
    }, function (err, res) {
      if (err) {
        console.error("ERROR", err);
        return;
      }
      var data = JSON.parse(res.body);
      console.log("BODY", JSON.stringify(data));
      if (typeof data.error !== "undefined") {
        if (data.error.code == 401) {
          console.error("YOUTUBE", data.error.message, "Token:", JSON.stringify(token_data));
          Refresh_Token(token_data, GetChannel);
          return;
        }
      }
      try {
        var channel_details = {};
        channel_details.channel_title = data.items[0].snippet.title;
        channel_details.description = data.items[0].snippet.description;
        channel_details.start_date = data.items[0].snippet.publishedAt;
        var thumb;
        if (typeof data.items[0].snippet.thumbnails.high !== "undefined") {
          thumb = data.items[0].snippet.thumbnails.high;
        } else if (typeof data.items[0].snippets.thumbnail.medium !== "undefined") {
          thumb = data.items[0].snippet.thumbnails.medium;
        } else {
          thumb = data.items[0].snippet.thumbnails.default;
        }
        channel_details.thumbnail = thumb.url;
        if (typeof data.items[0].brandingsettings !== "undefined") {
          channel_details.banner = data.items[0].brandingsettings.image.bannerimageurl;
        } else {
          channel_details.banner = "";
        }
        channel_details.main_playlist = data.items[0].contentDetails.relatedPlaylists.uploads;
        channel_details.views = data.items[0].statistics.viewCount;
        channel_details.subscriber = data.items[0].statistics.subscriberCount;
        channel_details.videos = data.items[0].statistics.videoCount;
        channel_details.user_id = token_data.id;
        channel_details.service = "youtube";
        channel_details.channel_id = data.items[0].id;

        channel.import_details(null, (err) => { if (err) { console.error("Channel Import", err); } }, channel_details);
        console.log(channel_details);
      } catch (e) {
        console.error(e);
      }
    });
  });
};