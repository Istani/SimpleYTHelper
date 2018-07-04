const oauth = require("../models/login_oauth.js");
var youtube = {};
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
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
    passport.use(new GoogleStrategy({
      clientID: data[0].client_id,
      clientSecret: data[0].client_secret,
      callbackURL: "http://127.0.0.1:3000/"
    },
      (token, refreshToken, profile, done) => {
        return done(null, {
          profile: profile,
          token: token
        });
      }));
  });
};