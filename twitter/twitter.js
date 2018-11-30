var config = require('dotenv').config();
var Twitter = require('twitter');

// https://www.npmjs.com/package/twitter
var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
// Auth as Istani! - Think about it when we add it to SYTH

client.post('statuses/update', { status: 'Testing my new App!' }, function (error, tweet, response) {
  if (error) {
    console.error(error);
    return;
  }
  console.log("Tweet OK!");
  //console.log(tweet);  // Tweet body.
  //console.log(response);  // Raw response object.
});