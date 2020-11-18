process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require("dotenv").config({ path: "../.env" });

const Twitter = require("twit");
const Jimp = require("jimp");
const fs = require("fs");
const cron = require("node-cron");
const Queue = require("better-queue");

const Tweets = require("./models/send_tweets.js");
const Chat_Message = require("./models/chat_message.js");

var q = new Queue(function(type, input, cb) {
  console.log("Start: " + type);
  input();
  cb(null, result);
});

// https://www.npmjs.com/package/twitter

var client = new Twitter({
  // Istani
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
var client_gos = new Twitter({
  // Games on Sale
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.GOS_TWITTER_TOKEN,
  access_token_secret: process.env.GOS_TWITTER_SECRET
});

cron.schedule("*/2 * * * *", () => {
  q.push("Tweets Send Main", () => {
    tweet_main();
  });
});
cron.schedule("*/15 * * * *", () => {
  q.push("Tweets Send Game on Sale", () => {
    tweet_gos();
  });
});
cron.schedule("*/30 * * * *", () => {
  q.push("Tweets Read Main", () => {
    get_usertweets();
  });
});

async function tweet_main() {
  var pre_tweet = await Tweets.query().where("user", "Istani");
  if (pre_tweet.length > 0) {
    await client.post(
      "statuses/update",
      { status: pre_tweet[0].message },
      async function(error, tweet, response) {
        if (error) {
          console.error(error);
          return;
        }
        await Tweets.query()
          .delete()
          .where("id", pre_tweet[0].id);
        console.log(pre_tweet[0]);
      }
    );
  }
}

async function tweet_gos() {
  var pre_tweet = await Tweets.query().where("user", "GamesOnSaleDE");
  if (pre_tweet.length > 0) {
    await client_gos.post(
      "statuses/update",
      { status: pre_tweet[0].message },
      async function(error, tweet, response) {
        if (error) {
          console.error(error);
          return;
        }
        await Tweets.query()
          .delete()
          .where("id", pre_tweet[0].id);
        console.log(pre_tweet[0]);
      }
    );
  }
}

async function bg_gos() {
  var img = await Jimp.read("../gamesite/public/img/background.png");
  img.scaleToFit(700, 200);
  img.contain(
    700,
    200,
    Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE
  );
  img.getBase64(Jimp.AUTO, (err, res) => {
    if (err) {
      console.error(err);
      //return;
    }

    var data = res.split(",");
    client_gos.post(
      "account/update_profile_banner",
      { image: data[1], media: data[0] },
      async function(error, response) {
        if (error) {
          console.error(error);
        }
        //console.log(response);
        console.log("GOS Banner Picture Update!");
      }
    );
  });
  //img.write("gos_bg.png");
}
async function pp_gos() {
  var img = await Jimp.read("../gamesite/public/img/text.png");
  await img.scaleToFit(400, 400);
  await img.contain(
    400,
    400,
    Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE
  );
  await img.getBase64(Jimp.AUTO, (err, res) => {
    if (err) {
      console.error(err);
    }
    var data = res.split(",");
    client_gos.post(
      "account/update_profile_image",
      { image: data[1], media: data[0] },
      async function(error, response) {
        if (error) {
          console.error(error);
        }
        //console.log(response);
        console.log("GOS Profile Picture Update!");
      }
    );
  });
  //await img.write("gos_pp.png");
}
async function pp_main(picture_path) {
  var img = await Jimp.read("tmp/" + picture_path);
  await img.scaleToFit(400, 400);
  await img.contain(
    400,
    400,
    Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE
  );
  await img.getBase64(Jimp.AUTO, (err, res) => {
    if (err) {
      console.error(err);
    }
    var data = res.split(",");
    client.post(
      "account/update_profile_image",
      { image: data[1], media: data[0] },
      async function(error, response) {
        if (error) {
          console.error(error);
        }
        //console.log(response);
        console.log("Upload Picture: " + picture_path);
      }
    );
  });
  //await img.write("main_pp.png");
}
async function get_pciture_from_url(url, picname) {
  var img = await Jimp.read(url);
  await img.write("tmp/" + picname);
}

async function AddMessage(tweet) {
  var tmp_message = {};

  // Keys
  tmp_message.service = package_info.name.replace("syth-", "");
  tmp_message.server = tweet.user.id;
  if (tweet.in_reply_to_user_id == null) {
    tmp_message.room = "TimeLine";
  } else {
    tmp_message.room = tweet.in_reply_to_user_id;
  }
  tmp_message.id = tweet.id_str;

  var m = await Chat_Message.query().where(tmp_message);

  // Additons
  tmp_message.user = tweet.user.id;
  tmp_message.timestamp = tweet.created_at;
  tmp_message.content = tweet.text;

  if (m.length == 0) {
    console.log("Message:", JSON.stringify(tmp_message));
    await Chat_Message.query().insert(tmp_message);
    check_special_tweet(tweet);
  } else {
    //console.log('Message Repeat:', JSON.stringify(tmp_message));
    await Chat_Message.query()
      .patch(tmp_message)
      .where(m[0]);
  }
}

async function get_usertweets() {
  var options = { screen_name: "istani" };

  client.get("statuses/user_timeline", options, async function(err, data) {
    fs.writeFileSync("tmp/tweets.json", JSON.stringify(data, null, 2));
    for (var i = 0; i < data.length; i++) {
      AddMessage(data[i]);
    }
  });
}
async function check_special_tweet(tweet) {
  //console.log(data[i].text);
  if (tweet.text.includes("#dailyselfie")) {
    if (typeof tweet.entities.media[0].media_url != undefined) {
      await get_pciture_from_url(
        tweet.entities.media[0].media_url,
        tweet.user.screen_name + ".jpg"
      );

      console.log("Picture Download for " + tweet.user.screen_name);
      await pp_main(tweet.user.screen_name + ".jpg");
    }

    var output_string =
      '<blockquote class="twitter-tweet"><p lang="de" dir="ltr">' +
      tweet.text +
      "</p>&mdash; " +
      tweet.user.name +
      " (@" +
      tweet.user.screen_name +
      ') <a href="https://twitter.com/' +
      tweet.user.screen_name +
      "/status/" +
      tweet.id_str +
      '?ref_src=twsrc%5Etfw">' +
      tweet.created_at +
      '</a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script><br><br>\n\r';
    fs.appendFileSync("tmp/dailyselfie.txt", output_string);
  }
}

bg_gos();
pp_gos();
//get_usertweets();
