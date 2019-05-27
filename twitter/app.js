process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require('dotenv').config({ path: '../.env' });

var Twitter = require('twitter');

const Tweets = require("./models/send_tweets.js");

// https://www.npmjs.com/package/twitter

var client = new Twitter({  // Istani
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
var client_gos = new Twitter({  // Games on Sale
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.GOS_TWITTER_TOKEN,
  access_token_secret: process.env.GOS_TWITTER_SECRET
});

async function tweet_main() {
  var pre_tweet = await Tweets.query().where('user', 'Istani');
  if (pre_tweet.length > 0) {
    await client.post('statuses/update', { status: pre_tweet[0].message }, async function (error, tweet, response) {
      if (error) {
        console.error(error);
        return;
      }
      await Tweets.query().delete().where('id', pre_tweet[0].id);
    });
  }
  setTimeout(tweet_main, 5 * 60 * 1000);
}

async function tweet_gos() {
  var pre_tweet = await Tweets.query().where('user', 'GamesOnSaleDE');
  if (pre_tweet.length > 0) {
    await client_gos.post('statuses/update', { status: pre_tweet[0].message }, async function (error, tweet, response) {
      if (error) {
        console.error(error);
        return;
      }
      await Tweets.query().delete().where('id', pre_tweet[0].id);
    });
  }
  setTimeout(tweet_gos, 5 * 60 * 1000);
}

async function bg_gos() {
  var img = await Jimp.read('../gamesite/public/img/games/background.png');
  img.getBase64(Jimp.AUTO, (err, res) => {
    if (err) {
      return;
    }
    client_gos.post('account/update_profile_banner', { image: res }, async function (error, tweet, response) {
      if (error) {
        console.error(error);
        return;
      }
    });
  });
}
async function pp_gos() {
  var img = await Jimp.read('../gamesite/public/img/games/text.png');
  img.getBase64(Jimp.AUTO, (err, res) => {
    if (err) {
      return;
    }
    client_gos.post('account/update_profile_image', { image: res }, async function (error, tweet, response) {
      if (error) {
        console.error(error);
        return;
      }
    });
  });

}

bg_gos();
pp_gos();
tweet_gos();
tweet_main();
