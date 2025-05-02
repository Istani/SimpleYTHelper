const config = require("dotenv").config({ path: "../.env" });
const moment = require("moment");
const Token = require("./models/syth_token.js");
var { google } = require("googleapis");
var service = google.youtube("v3");
var OAuth2 = google.auth.OAuth2;

async function startTokens() {
  var t = await Token.query().where("service", "youtube");
  //authorize(ListChannels);
  authorize(SearchBroadcasts);
}
startTokens();

async function authorize(callback) {
  var clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  var clientId = process.env.YOUTUBE_CLIENT_ID;
  var redirectUrl = process.env.YOUTUBE_CLINET_URI;
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  var user_token = await Token.query().where("service", "youtube")
  let index = 0;
  const element = user_token[index];
  oauth2Client.credentials = element;
  callback(oauth2Client);
}

function ListChannels(auth) {
  var sic = auth.credentials;
  service.channels.list(
    {
      auth: auth,
      part: "id, brandingSettings, contentDetails, snippet, statistics",
      mine: true,
      maxResults: 50
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      console.log(response.data);
    }
  )
}


function SearchBroadcasts(auth, pageToken = "") {
  var sic = auth.credentials;
  service.liveBroadcasts.list(
    //service.liveStreams.list(
    {
      auth: auth,
      part: "id, snippet",
      mine: true,
      maxResults: 1,
      pageToken: pageToken
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      for (let index = 0; index < response.data.items.length; index++) {
        const element = response.data.items[index];

        var obj = {};
        obj.service = "youtube";
        obj.b_id = element.id;
        obj.owner = element.snippet.channelId;
        obj.b_title = element.snippet.title;

        if (typeof element.snippet.actualStartTime == "undefined") {
          obj.actualStartTime = moment(
            element.snippet.scheduledStartTime
          ).toISOString();
        } else {
          obj.actualStartTime = moment(
            element.snippet.actualStartTime
          ).toISOString();
        }
        if (typeof element.snippet.actualEndTime == "undefined") {
          obj.actualEndTime = null;
        } else {
          obj.actualEndTime = element.snippet.actualEndTime;
        }
        if (typeof element.snippet.liveChatId == "undefined") {
          obj.liveChatId = "";
        } else {
          obj.liveChatId = element.snippet.liveChatId;
        }
        //console.log(obj);
        LiveChat(auth, obj.liveChatId)
      }
      
    }
  )
}

async function LiveChat(auth, live_chat_id, pageToken = "") {
  service.liveChatMessages.list(
    {
      auth: auth,
      part: "snippet, authorDetails",
      liveChatId: live_chat_id,
      pageToken: pageToken,
      maxResults: 2000
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      var txt = response.data.items;
      
      for (let index = 0; index < txt.length; index++) {
        const element = txt[index];

        var tmp_message = {};

        // Keys
        tmp_message.service = "youtube";
        tmp_message.id = element.id;

        // Additons
        tmp_message.user = element.snippet.authorChannelId;
        tmp_message.timestamp = element.snippet.publishedAt;
        tmp_message.content = element.snippet.displayMessage;

        console.log("Message: ", JSON.stringify(tmp_message));
      }
      process.exit(0);
    }
  )
}
