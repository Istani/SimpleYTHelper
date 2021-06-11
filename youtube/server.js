process.chdir(__dirname);
const package_info = require("./package.json");
var software =
  package_info.name +
  " (V " +
  package_info.version +
  ") by " +
  package_info.author;
console.log(software);
console.log("=".repeat(software.length));
console.log();

const config = require("dotenv").config({ path: "../.env" });
const moment = require("moment");

var { google } = require("googleapis");
var OAuth2 = google.auth.OAuth2;

var SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"];

var q_startDate = moment()
  .subtract(90, "days")
  .format("YYYY-MM-DD");
var q_endDate = moment()
  .subtract(14, "days")
  .format("YYYY-MM-DD");

function getNewToken(socket, add_scope) {
  var temp_scope = SCOPES;
  if (typeof add_scope != "undefined") {
    temp_scope = add_scope;
  }
  var authUrl = socket.oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: temp_scope
  });
  socket.emit("Link", authUrl);
}
function requestNewToken(code, socket) {
  socket.oauth2Client.getToken(code, function(err, token) {
    if (err) {
      socket.emit(
        "TOKEN Error",
        "Error while trying to retrieve access token: ",
        err
      );
      return;
    }
    socket.oauth2Client.credentials = token;
    getChannel(socket);
  });
}

function getChannel(socket, pageToken = "") {
  console.log("Auth: ", socket.oauth2Client.credentials);
  var service = google.youtube("v3");
  service.channels.list(
    {
      auth: socket.oauth2Client,
      part: "snippet,statistics",
      mmaxResults: 10,
      mine: true,
      pageToken: pageToken
    },
    function(err, response) {
      if (err) {
        socket.emit(
          "API Error",
          "The API returned an error: ",
          JSON.stringify(err)
        );
        console.error("Channel: ", JSON.stringify(err));
        return;
      }
      var elemts = response.data.items;
      socket.oauth2Client.credentials.name = elemts[0].id;
      socket.emit("TOKEN", socket.oauth2Client.credentials);
      console.log("Token: ", JSON.stringify(socket.oauth2Client.credentials));

      socket.emit("channels", elemts);
      console.log("Channel: ", JSON.stringify(elemts));
    }
  );
}

function getBroadcast(socket, nextPageToken) {
  var service = google.youtube("v3");
  service.liveBroadcasts.list(
    {
      auth: socket.oauth2Client,
      part: "id, snippet",
      mine: true,
      maxResults: 50,
      pageToken: nextPageToken
    },
    async function(err, response) {
      if (err) {
        socket.emit(
          "API Error",
          "The API returned an error: ",
          JSON.stringify(err, null, 2)
        );
        console.error("Broadcast: ", JSON.stringify(err));
        return;
      }
      var elemts = response;
      socket.emit("broadcasts", elemts);
      console.log(
        "Broadcast: ",
        JSON.stringify(elemts.data),
        elemts.data.nextPageToken
      );
    }
  );
}

function getVideoDetails(socket, id) {
  var service = google.youtube("v3");
  service.videos.list(
    {
      auth: socket.oauth2Client,
      part: "id, statistics",
      id: id,
      pageToken: ""
    },
    async function(err, response) {
      if (err) {
        socket.emit(
          "API Error",
          "The API returned an error: ",
          JSON.stringify(err, null, 2)
        );
        console.error("Broadcast: ", JSON.stringify(err));
        return;
      }
      var elemts = response.data.items;
      socket.emit("videos", elemts);
      console.log("Video: ", JSON.stringify(elemts));
    }
  );
}

function getAnalyticsChannel(socket, args) {
  var analytics = google.youtubeAnalytics("v2");
  analytics.reports.query(
    {
      auth: socket.oauth2Client,
      ids: "channel==MINE",
      startDate: q_startDate,
      endDate: q_endDate,
      metrics:
        "views,comments,likes,dislikes,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,grossRevenue,estimatedRevenue",
      dimensions: "day",
      //dimensions: "video",//"day,video",
      sort: "day"
    },
    async function(err, response) {
      if (err) {
        socket.emit(
          "API Error",
          "The API returned an error: ",
          JSON.stringify(err, null, 2)
        );
        console.error("AnalyticsChannel: ", JSON.stringify(err));
        return;
      }
      var elemts = response;
      socket.emit("AnalyticsChannel", elemts);
      console.log("AnalyticsChannel: ", JSON.stringify(elemts.data));
    }
  );
}

function getAnalyticsVideo(socket, args) {
  var analytics = google.youtubeAnalytics("v2");
  analytics.reports.query(
    {
      auth: socket.oauth2Client,
      ids: "channel==MINE",
      startDate: q_startDate,
      endDate: q_endDate,
      metrics:
        "views,estimatedMinutesWatched,comments,likes,dislikes,averageViewDuration,averageViewPercentage",
      dimensions: "video",
      sort: "-views",
      maxResults: 100
    },
    async function(err, response) {
      if (err) {
        socket.emit(
          "API Error",
          "The API returned an error: ",
          JSON.stringify(err, null, 2)
        );
        console.error("AnalyticsVideo: ", JSON.stringify(err));
        return;
      }
      var elemts = response;
      socket.emit("AnalyticsVideo", elemts);
      console.log("AnalyticsVideo: ", JSON.stringify(elemts.data));
    }
  );
}

const io = require("socket.io")();

io.on("connection", socket => {
  console.log("Socket Connection");

  var clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  var clientId = process.env.YOUTUBE_CLIENT_ID;
  var redirectUrl = process.env.YOUTUBE_CLINET_URI;
  //socket.oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  socket.on("New", (cfg, new_scopes) => {
    if (typeof cfg != "undefined") {
      console.log("cfg: ", JSON.stringify(cfg));
      socket.oauth2Client = new OAuth2(
        cfg.clientId,
        cfg.clientSecret,
        cfg.redirectUrl
      );
    }
    if (typeof cfg != "undefined") {
      console.log("scope: ", JSON.stringify(new_scopes));
    }
    console.log("New User");
    getNewToken(socket, new_scopes);
  });
  socket.on("Code", args => {
    requestNewToken(args, socket);
  });
  socket.on("Auth", (args, cfg) => {
    if (typeof cfg != "undefined") {
      console.log("cfg: ", JSON.stringify(cfg));
      socket.oauth2Client = new OAuth2(
        cfg.clientId,
        cfg.clientSecret,
        cfg.redirectUrl
      );
    }

    socket.oauth2Client.credentials = JSON.parse(args);
    getChannel(socket);
  });

  socket.on("Search", nextPageToken => {
    getBroadcast(socket, nextPageToken);
  });
  socket.on("VideoStatistic", args => {
    getVideoDetails(socket, args);
  });

  socket.on("AnalyticsChannel", args => {
    getAnalyticsChannel(socket, args);
  });
  socket.on("AnalyticsVideo", args => {
    getAnalyticsVideo(socket, args);
  });
});

io.listen(3006);
