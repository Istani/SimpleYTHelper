const oauth = null; //require("../models/login_oauth.js");
var youtube = {};
var twitchStrategy = require("@oauth-everything/passport-twitch").Strategy;
var async = require("async");

module.exports = passport => {
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
  passport.use(
    new twitchStrategy(
      {
        clientID: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/twitch/callback"
      },
      function(accessToken, refreshToken, profile, done) {
        var user = {
          accessToken: accessToken,
          refreshToken: refreshToken,
          profile: profile
        };
        return done(null, user);
      }
    )
  );
};
