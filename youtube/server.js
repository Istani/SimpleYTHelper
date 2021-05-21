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

var { google } = require("googleapis");
var OAuth2 = google.auth.OAuth2;

var SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"];

function getNewToken(socket) {
  var authUrl = socket.oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
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
    socket.emit("TOKEN", socket.oauth2Client.credentials);
    getChannel(socket);
  });
}

function getChannel(socket) {
  console.log("Auth: ", socket.oauth2Client.credentials);
  var service = google.youtube("v3");
  service.channels.list(
    {
      auth: socket.oauth2Client,
      part: "snippet,statistics",
      mine: true
    },
    function(err, response) {
      if (err) {
        socket.emit(
          "API Error",
          "The API returned an error: ",
          JSON.stringify(err)
        );
        console.err("Channel: ", JSON.stringify(err));
        return;
      }
      var elemts = response.data.items;
      socket.emit("channels", elemts);
      console.log("Channel: ", JSON.stringify(elemts));
    }
  );
}

function getBroadcast(socket) {
  var service = google.youtube("v3");
  service.liveBroadcasts.list(
    {
      auth: socket.oauth2Client,
      part: "id, snippet",
      mine: true
    },
    async function(err, response) {
      if (err) {
        socket.emit(
          "API Error",
          "The API returned an error: ",
          JSON.stringify(err, null, 2)
        );
        console.err("Broadcast: ", JSON.stringify(err));
        return;
      }
      var elemts = response.data.items;
      socket.emit("broadcasts", elemts);
      console.log("Broadcast: ", JSON.stringify(elemts));
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
        console.err("Broadcast: ", JSON.stringify(err));
        return;
      }
      var elemts = response.data.items;
      socket.emit("videos", elemts);
      console.log("Video: ", JSON.stringify(elemts));
    }
  );
}

const io = require("socket.io")();

io.on("connection", socket => {
  console.log("Socket Connection");

  var clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  var clientId = process.env.YOUTUBE_CLIENT_ID;
  var redirectUrl = process.env.YOUTUBE_CLINET_URI;
  socket.oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  socket.on("New", cfg => {
    if (typeof cfg != "undefined") {
      socket.oauth2Client = new OAuth2(
        cfg.clientId,
        cfg.clientSecret,
        cfg.redirectUrl
      );
    }
    console.log("New User");
    getNewToken(socket);
  });
  socket.on("Code", args => {
    requestNewToken(args, socket);
  });
  socket.on("Auth", (args, cfg) => {
    if (typeof cfg != "undefined") {
      socket.oauth2Client = new OAuth2(
        cfg.clientId,
        cfg.clientSecret,
        cfg.redirectUrl
      );
    }

    socket.oauth2Client.credentials = JSON.parse(args);
    getChannel(socket);
  });

  socket.on("Search", args => {
    getBroadcast(socket);
  });
  socket.on("VideoStatistic", args => {
    getVideoDetails(socket, args);
  });
});

io.listen(3006);
