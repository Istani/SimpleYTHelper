const oauth = null; //require("../models/login_oauth.js");
var youtube = {};
var YoutubeV3Strategy = require("passport-youtube-v3").Strategy;
var async = require("async");

module.exports = passport => {
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
  passport.use(
    new YoutubeV3Strategy(
      {
        clientID: process.env.YOUTUBE_CLIENT_ID,
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
        callbackURL: "http://games-on-sale.de/auth/youtube/callback"
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
