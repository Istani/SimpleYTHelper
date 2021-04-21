process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require("dotenv").config({ path: "../.env" });

var fs = require("fs");
var Queue = require("better-queue");
var cron = require("node-cron");
const emoji = require("node-emoji");
const sleep = require("await-sleep");
const moment = require("moment");

var q_startDate = moment()
  .subtract(90, "days")
  .format("YYYY-MM-DD");
var q_endDate = moment()
  .subtract(14, "days")
  .format("YYYY-MM-DD");

var readline = require("readline");
var { google } = require("googleapis");

const Token = require("./models/syth_token.js");

var RepeatDealy = 30 * 1000;
var SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtubepartner",
  "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly"
];
var OAuth2 = google.auth.OAuth2;

var analytics = google.youtubeAnalytics("v2");
var q = new Queue(function(type, input, cb) {
  console.log("Start Import: " + type);
  input();
  cb(null, result);
});

async function startTokens() {
  //await Token.query()
  //  .where("service", "youtube")
  //  .patch({ is_importing: false });
  authorize(StartImport);
}

var oauth2Client;
async function authorize(callback) {
  var clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  var clientId = process.env.YOUTUBE_CLIENT_ID;
  var redirectUrl = process.env.YOUTUBE_CLINET_URI;
  oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  var user_token = await Token.query().where("service", "youtube");
  //  .where("is_importing", false);
  for (let index = 0; index < user_token.length; index++) {
    const element = user_token[index];
    //await Token.query()
    //  .where(element)
    //  .patch({ is_importing: true });
    oauth2Client.credentials = element;
    await callback(oauth2Client);
  }
  //setTimeout(() => {
  //  authorize(callback);
  //}, 1000);
  //process.exit(0);
}
startTokens();

async function StartImport(auth) {
  var sic = auth.credentials;
  /*cron.schedule("0 * * * *", () => {
    q.push("Uploads", () => {
      auth.credentials = sic;
      ListNewUploads(auth);
    });
  });*/
  await test_report(sic, "");
}

async function test_report(auth, pageToken = "") {
  var sic = auth.credentials;
  console.log(auth);
  var sic_user = auth.service_user;
  google.options({ auth: oauth2Client });
  analytics.reports.query(
    {
      auth: sic,
      ids: "channel==MINE",
      startDate: q_startDate,
      endDate: q_endDate,
      //metrics: "views,comments,likes,dislikes,estimatedMinutesWatched,averageViewDuration,averageViewPercentage",//,subscribersGained,subscribersLost", // grossRevenue,estimatedRevenue,
      //dimensions: "day",
      //dimensions: "video",//"day,video",
      //sort: "day"
      //alt: "csv" // In V2 nicht OK
      metrics:
        "views,estimatedMinutesWatched,comments,likes,dislikes,averageViewDuration,averageViewPercentage",
      dimensions: "video",
      sort: "-views",
      maxResults: 100
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      try {
        fs.writeFileSync(
          "tmp/report_" + sic_user + ".json",
          JSON.stringify(response, null, 2)
        );
        console.log("done");
      } catch (e) {
        console.error(e);
      }
    }
  );
}
