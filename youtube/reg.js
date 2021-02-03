const config = require("dotenv").config({ path: "../.env" });

var fs = require("fs");
var readline = require("readline");
var { google } = require("googleapis");
var OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.channel-memberships.creator"
];
var TOKEN_DIR = "./";
var TOKEN_PATH = TOKEN_DIR + "youtube-nodejs-quickstart.json";

// Load client secrets from a local file.
authorize(getChannel);

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(callback) {
  var clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  var clientId = process.env.YOUTUBE_CLIENT_ID;
  var redirectUrl = process.env.YOUTUBE_CLINET_URI;
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  getNewToken(oauth2Client, callback);
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url: ", authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log("Error while trying to retrieve access token", err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != "EEXIST") {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
    if (err) throw err;
    console.log("Token stored to " + TOKEN_PATH);
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

var LiveVideoID = undefined;
function getChannel(auth) {
  var service = google.youtube("v3");
  /*service.channels.list({
    auth: auth,
    part: 'snippet,contentDetails,statistics',
    forUsername: 'Defender833gaming'
  }, function (err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var channels = response.data.items;
    if (channels.length == 0) {
      console.log('No channel found.');
    } else {
      console.log('This channel\'s ID is %s. Its title is \'%s\', and ' +
        'it has %s views.',
        channels[0].id,
        channels[0].snippet.title,
        channels[0].statistics.viewCount);
    }
  });*/
  service.search.list(
    {
      auth: auth,
      part: "id",
      channelId: "UC5DOhI70dI3PnLPMkUsosgw",
      eventType: "live",
      type: "video"
    },
    function(err, response) {
      try {
        LiveVideoID = response.data.items[0].id.videoId;

        service.liveBroadcasts.list(
          {
            auth: auth,
            part: "snippet",
            id: LiveVideoID
          },
          function(err, response) {
            console.log(response.data.items[0]);
            console.log(LiveVideoID);
          }
        );
      } catch (e) {
        LiveVideoID = undefined;
      }
    }
  );
}
