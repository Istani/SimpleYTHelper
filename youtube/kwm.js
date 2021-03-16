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
var OAuth2 = new google.auth.GoogleAuth({
  scopes: [SCOPES]
});
const authClient = await OAuth2.getClient();
google.options({ auth: authClient });

var analytics = google.youtubeAnalytics("v2");
var q = new Queue(function(type, input, cb) {
  console.log("Start Import: " + type);
  input();
  cb(null, result);
});

async function startTokens() {
  await Token.query()
    .where("service", "youtube")
    .patch({ is_importing: false });
  authorize(StartImport);
}

async function authorize(callback) {
  var clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  var clientId = process.env.YOUTUBE_CLIENT_ID;
  var redirectUrl = process.env.YOUTUBE_CLINET_URI;
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  var user_token = await Token.query()
    .where("service", "youtube")
    .where("is_importing", false);
  for (let index = 0; index < user_token.length; index++) {
    const element = user_token[index];
    await Token.query()
      .where(element)
      .patch({ is_importing: true });
    oauth2Client.credentials = element;
    callback(oauth2Client);
  }
  setTimeout(() => {
    authorize(callback);
  }, 1000);
}
startTokens();

function StartImport(auth) {
  var sic = auth.credentials;
  /*cron.schedule("0 * * * *", () => {
    q.push("Uploads", () => {
      auth.credentials = sic;
      ListNewUploads(auth);
    });
  });*/
  test_report(sic, "");
}

async function test_report(auth, pageToken = "") {
  var sic = auth.credentials;
  analytics.reports.query(
    {
      auth: auth,
      ids: "channel=MINE",
      startDate: "2020-01-01",
      endDate: "2020-01-31",
      metrics:
        "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained",
      dimensions: "day",
      sort: "day"
    },
    async function(err, responste) {
      if (err) {
        console.error(err);
        return;
      }
      try {
        fs.writeFileSync("tmp/report.json", JSON.stringify(response, null, 2));
        console.log("done");
      } catch (e) {
        console.error(e);
      }
    }
  );
}
