const async = require('async');
const db = require("./db.js");
var request = require('request');

/*
request({
  url: 'https://api.someapi.com/oauth/token',
  method: 'POST',
  auth: {
    user: 'xxx',
    pass: 'yyy'
  },
  form: {
    'grant_type': 'client_credentials'
  }
}, function (err, res) {
  var json = JSON.parse(res.body);
  console.log("Access Token:", json.access_token);
});

/* ----------------------------------------------------------------- */
/*
var request = require('request');
var accessToken = 'ACCESS_TOKEN_HERE';

request({
  url: 'https://api.someapi.com/blah/something',
  auth: {
    'bearer': accessToken
  }
}, function (err, res) {
  console.log(res.body);
});

/* ----------------------------------------------------------------- */

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
    console.log("ERROR", err);
    process.exit(1);
  }
  //console.log("Settings", OAuth_Settings, OAuth_Bot_User);
  GetChannel(OAuth_Bot_User);
});

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
      //console.error(err);
      return;
    }
    var data = JSON.parse(res.body);
    console.log("BODY", JSON.stringify(data));
    if (typeof data.error !== "undefined") {
      console.error("YOUTUBE", "REFRESH", data.error);
      return; // TODO: Token löschen?!?
    }
    token_data.access_token = data.access_token;
    org_function(token_data);
  });
}

function GetChannel(token_data) {
  request({
    url: 'https://www.googleapis.com/youtube/v3/channels',
    auth: {
      'bearer': token_data.access_token
    },
    qs: {
      "mine": "true",
      "part": "contentDetails,snippet"
    }
  }, function (err, res) {
    if (err) {
      //console.error(err);
      return;
    }
    var data = JSON.parse(res.body);
    console.log("BODY", JSON.stringify(data));
    if (typeof data.error !== "undefined") {
      if (data.error.code == 401) {
        console.error("YOUTUBE", data.error.message);
        Refresh_Token(token_data, GetChannel);
      }
    }
  });
};