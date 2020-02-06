process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

var envpath = __dirname + "/../.env";
console.log("Settingspath:", envpath);
var config = require("dotenv").config({ path: envpath });

// Modules
var express = require("express");
const async = require("async");

var app = express();
var key = process.env.TWITTER_CONSUMER_KEY;
var secret = process.env.TWITTER_CONSUMER_SECRET;
const TwitterApi = require("node-twitter-signin");

//really simple, right?
app.use(
  "/",
  TwitterApi(
    key,
    secret,
    "http://localhost:3003/twitter/callback",
    callback,
    callback_render
  )
);

/**
    key:  twitter app's consumer key
    secret: twitter app's consumer secret 
    callbackUrl: callback url. 
       In this case, using TwitterApi in the route '/', the url is 'http://localhost:3000/twitter/callback'
    
    callback: function that will be called giving you the authenticated user and its token.
      for example:*/
function callback(user, token) {
  //do whatever you want with the user and its token
  //like, save on the database, send a message through socketio to the client app, etc...
  console.log("user", user);
  console.log("token", token);

  //token has the properties below:
  //  -token (is the access_token)
  //  -secret (is the token secret)
  //  -request_token (is the related request_token )
}
/*
    callback_render: will be called giving the express 'res' object to allow you decide 
      what to send to the client when your callbackUrl is called.
      for example:*/
function callback_render(res) {
  res.json({
    msg: "success"
  });
}
/* */

app.listen(3003, () => console.log("Interface on 3003!"));
