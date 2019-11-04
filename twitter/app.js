process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require('dotenv').config({ path: '../.env' });

const Twitter = require('twit');
const Jimp = require("jimp");
const fs = require('fs');

const Tweets = require("./models/send_tweets.js");

// https://www.npmjs.com/package/twitter

var client = new Twitter({  // Istani
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
var client_gos = new Twitter({  // Games on Sale
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.GOS_TWITTER_TOKEN,
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
      console.log(pre_tweet[0]);
    });
  }
  setTimeout(tweet_main, 1 * 60 * 1000);
}

async function tweet_gos() {
  var pre_tweet = await Tweets.query().where('user', 'GamesOnSaleDE');
  if (pre_tweet.length > 0) {
    await client_gos.post('statuses/update', { status: pre_tweet[0].message }, async function (error, tweet, response) {
      if (error) {
        console.error(error);
        setTimeout(tweet_gos, 5 * 60 * 1000);
        return;
      }
      await Tweets.query().delete().where('id', pre_tweet[0].id);
      console.log(pre_tweet[0]);
      setTimeout(tweet_gos, 5 * 60 * 1000);
    });
  }
  setTimeout(tweet_gos, 5 * 60 * 1000);
}

async function bg_gos() {
  var img = await Jimp.read('../gamesite/public/img/background.png');
  img.scaleToFit(700, 200);
  img.contain(700, 200, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
  img.getBase64(Jimp.AUTO, (err, res) => {
    if (err) {
      console.error(err);
      //return;
    }

    var data = res.split(",");
    client_gos.post('account/update_profile_banner', { image: data[1], media: data[0] }, async function (error, response) {
      if (error) {
        console.error(error);
      }
      console.log(response);
    });
  });
  img.write('gos_bg.png');
}
async function pp_gos() {
  var img = await Jimp.read('../gamesite/public/img/text.png');
  await img.scaleToFit(400, 400);
  await img.contain(400, 400, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
  await img.getBase64(Jimp.AUTO, (err, res) => {
    if (err) {
      console.error(err);
    }
    var data = res.split(",");
    client_gos.post('account/update_profile_image', { image: data[1], media: data[0] }, async function (error, response) {
      if (error) {
        console.error(error);
      }
      console.log(response);
    });
  });
  await img.write('gos_pp.png');
}

//bg_gos();
//pp_gos();
tweet_gos();
tweet_main();


