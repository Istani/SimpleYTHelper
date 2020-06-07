process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

const async = require("async");
const fs = require("fs");
const requestp = require("request-promise");
const sleep = require("await-sleep");
const cheerio = require("cheerio");
const cheerioTableparser = require("cheerio-tableparser");
const striptags = require("striptags");

const Games = require("./models/game.js");
const GameLinks = require("./models/game_link.js");
const Tweets = require("./models/send_tweets.js");

const url =
  "https://metagamerscore.com/achievement?utf8=%E2%9C%93&user=9738&sort=myach_earned";

var main_page = 2;
var main_max_page = 4;

var settings = {};
function load_settings() {
  try {
    settings = require("./temp/settings.json");
    settings.last_time = new Date(settings.last_time);
  } catch (error) {
    console.error("Settings", "Couldn't load!");
    settings = {};
    settings.last_time = new Date();
    settings.last_time.setDate(settings.last_time.getDate() - 7);
  }
}
function save_settings() {
  var data = JSON.stringify(settings);
  fs.writeFileSync("./temp/settings.json", data);
  load_settings();
}

async function main() {
  load_settings();
  await requestp({ url: url }, async function(error, response, body) {
    $ = cheerio.load(body);
    cheerioTableparser($);
    var archivment_table = $("table").parsetable();
    var dump = [];
    for (var col = 0; col < archivment_table[0].length; col++) {
      for (var row = 0; row < archivment_table.length; row++) {
        if (typeof dump[col] == "undefined") {
          dump[col] = [];
        }
        if (typeof dump[col][row] == "undefined") {
          dump[col][row] = "";
        }
        dump[col][row] = striptags(archivment_table[row][col]).trim();
        if (row == 3) {
          var test = dump[col][row];
          test = test.split("\n");
          if (typeof test[1] != "undefined") {
            test = test[1].trim();
            dump[col][row] = test;
          }
        }
      }
    }
    //console.log(dump);
    for (var i = dump.length - 1; i > 0; i--) {
      var dat = new Date(dump[i][2]);
      if (dat > settings.last_time) {
        settings.last_time = dat;
        var temp_name = Games.getEncodedName(dump[i][3]);
        var details = await Games.query().where("name", temp_name);

        var tmp_tweet = {};
        tmp_tweet.user = "Istani";
        // [ 'The Stone League', '828', '2019-09-18 13:57', 'STM\n      Minion Masters' ]
        tmp_tweet.message =
          'New #Achievement: "' +
          dump[i][0] +
          '" in "' +
          dump[i][3] +
          '" #trophy';
        if (details.length > 0) {
          tmp_tweet.message += " http://games-on-sale.de/game/" + temp_name;
        }
        await Tweets.query().insert(tmp_tweet);
        console.log(tmp_tweet.message);
        //console.log(dump[i]);
      }
      save_settings();
    }
  });
  console.log("Achievment Import Done, Wating 1 Hour for Restart");
  setTimeout(() => {
    main();
  }, 1000 * 60);
}
main();
