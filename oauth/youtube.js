const oauth = require("../models/login_oauth.js");
var youtube = {};
var YoutubeV3Strategy = require('passport-youtube-v3').Strategy
var async = require("async");

module.exports = (passport) => {
  async.series([
    function (callback) { oauth.get_oauth_settings(youtube, callback, "youtube"); }
  ], function (err, data) {
    passport.serializeUser((user, done) => {
      done(null, user);
    });
    passport.deserializeUser((user, done) => {
      done(null, user);
    });
    passport.use(new YoutubeV3Strategy({
      clientID: data[0].client_id,
      clientSecret: data[0].client_secret,
      callbackURL: "http://127.0.0.1:3000/auth/youtube/callback"
    },
      function (accessToken, refreshToken, profile, done) {
        var user = {
          'accessToken': accessToken,
          'refreshToken': refreshToken,
          'profile': profile
        }
        return done(null, user);
      }));
  });
};