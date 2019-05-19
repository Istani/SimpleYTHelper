process.chdir(__dirname);
const package_info = require('./package.json');
var software=package_info.name+" (V "+package_info.version+")";
console.log(software);
console.log("===");
console.log();
const config = require('dotenv').config({path: '../.env'});

var Twitter = require('twitter');

const Tweets = require("./models/send_tweets.js");

// https://www.npmjs.com/package/twitter
var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
// Auth as Istani! - Think about it when we add it to SYTH

var client_gos = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.GOS_TWITTER_TOKEN,
  access_token_secret: process.env.GOS_TWITTER_SECRET
});

async function tweet_main() {
  client.post('statuses/update', { status: 'Testing my new App!' }, function (error, tweet, response) {
    if (error) {
      console.error(error);
      return;
    }
    console.log("Tweet OK!");
  });
}

async function tweet_gos() {
  var tweet = await Tweets.query().where('user','GamesOnSaleDE');
  if (tweet.length>0) {
    await client_gos.post('statuses/update', { status: tweet[0].message }, async function (error, tweet, response) {
      if (error) {
        console.error(error);
        return;
      }
      await Tweets.query().delete().where('id',tweet[0].id);
    });
  }
  setTimeout(tweet_gos,5*60*1000);
}
tweet_gos();
