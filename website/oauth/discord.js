const oauth = null; //require("../models/login_oauth.js");
var youtube = {};
var DiscordStrategy = require("passport-discord").Strategy;
var async = require("async");
// passport-oauth2-refresh

module.exports = passport => {
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
  passport.use(
    new DiscordStrategy(
      {
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: "http://syth.games-on-sale.de/auth/discord/callback"
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
