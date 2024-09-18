const config = require("dotenv").config({ path: "../../.env" });

const oauth = null; //require("../models/login_oauth.js");
var youtube = {};
var twitchStrategy = require("@oauth-everything/passport-twitch").Strategy;
var async = require("async");

console.log(process.env.TWITCH_CLIENT_ID);

module.exports = passport => {
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
  passport.use(
    // clientID at twitch -> Client-ID
    new twitchStrategy(
      {
        clientID: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
        callbackURL: "http://syth.games-on-sale.de/auth/twitch/callback",
        customHeaders: {
          "Client-ID": process.env.TWITCH_CLIENT_ID
        }
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
