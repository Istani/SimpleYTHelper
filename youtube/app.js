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

const sponsors = require("./models/member.js");
const ow_playlist = require("./models/playlists.js");
const ow_playlistitems = require("./models/playlists_items.js");
const ow_broadcasts = require("./models/broadcast.js");
const ow_videos = require("./models/videos.js");
const ow_channel = require("./models/channel.js");
const Outgoing_Message = require("./models/outgoing_messages.js");
const Chat_Message = require("./models/chat_message.js");
const Chat_Room = require("./models/chat_room.js");
const Chat_Server = require("./models/chat_server.js");
const Chat_User = require("./models/chat_user.js");
const Token = require("./models/syth_token.js");

var RepeatDealy = 30 * 1000;
var SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtubepartner",
  "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly"
];
var OAuth2 = google.auth.OAuth2;
var service = google.youtube("v3");
var analytics = google.youtubeAnalytics("v2");
const io = require("socket.io")();
var q = new Queue(function(type, input, cb) {
  console.log("Start Import: " + type);
  input();
  cb(null);
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
  if (user_token.length>0) {
    let index = 0;
    //for (let index = 0; index < user_token.length; index++) {
    const element = user_token[index];
    await Token.query()
      .where(element)
      .patch({ is_importing: true });
    oauth2Client.credentials = element;
    callback(oauth2Client);
    //}
  }
  setTimeout(() => {
    authorize(StartImport);
  }, 1000);
}
startTokens();

function StartImport(auth) {
  var sic = auth.credentials;
  fs.writeFileSync("tmp/auth.json", JSON.stringify(auth, null, 2));

  q.push("Channels", () => {
    auth.credentials = sic;
    ListChannels(auth);
  });
  q.push("Broadcasts", () => {
    auth.credentials = sic;
    SearchBroadcasts(auth);
  });
  q.push("Analytics", () => {
    auth.credentials = sic;
    ImportAnalytics(auth);
  });
  q.push("ChannelAnalytics", () => {
    auth.credentials = sic;
    ImportChannelAnalytics(auth);
  });

  cron.schedule("0 0 * * *", () => {
    q.push("Uploads", () => {
      auth.credentials = sic;
      ListNewUploads(auth);
    });
  });

  cron.schedule("*/20 * * * *", () => {
    q.push("Broadcasts", () => {
      auth.credentials = sic;
      SearchBroadcasts(auth);
    });
  });

  cron.schedule("50 21 * * *", () => {
    q.push("Channels", () => {
      auth.credentials = sic;
      ListChannels(auth);
    });
    q.push("Sponsors", () => {
      auth.credentials = sic;
      ListMembers(auth);
    });
    setTimeout(() => {
      // Damit dann Channels und Sponsors vielleicht schon fertig ist
      q.push("Playlists", () => {
        auth.credentials = sic;
        ListPlaylists(auth);
      });
    }, RepeatDealy);
  });

  cron.schedule("50 22 * * *", () => {
    q.push("Videos", () => {
      auth.credentials = sic;
      ListVideos(auth);
    });
  });

  cron.schedule("0 3 * * *", () => {
    q.push("Analytics", () => {
      auth.credentials = sic;
      ImportAnalytics(auth);
    });
    q.push("ChannelAnalytics", () => {
      auth.credentials = sic;
      ImportChannelAnalytics(auth);
    });
  });

  q.push("LiveChat", () => {
    auth.credentials = sic;
    LiveChat(auth);
    auth.credentials = sic;
  });

  if (sic.id == 5) {
    auth.credentials = sic;
    CheckForMessages(auth);
  }
}

async function ListVideos(auth, pageToken = "", nextPage = true) {
  var max_per_request = 50;
  pageToken = pageToken * 1; // parseInt wollte ja nicht mit einen leeren string arbeiten!

  var sic = auth.credentials;
  var channel_obj = await ow_channel
    .query()
    .where("service", "youtube")
    .where("user_id", sic.user_id);
  var playlists_obj = await ow_playlistitems
    .query()
    .where("pl_id", channel_obj[0].main_playlist)
    .orderBy("created_at", "DESC")
    .limit(max_per_request)
    .offset(pageToken);
  var abfrage_string = "";
  for (let pl_index = 0; pl_index < playlists_obj.length; pl_index++) {
    const element = playlists_obj[pl_index];
    if (abfrage_string != "") {
      abfrage_string += ",";
    }
    abfrage_string += element.video_id;
  }
  service.videos.list(
    {
      auth: auth,
      part: "id, snippet, statistics, status",
      id: abfrage_string,
      //maxResults: max_per_request,
      pageToken: ""
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      fs.writeFileSync(
        "tmp/videos.json",
        JSON.stringify(response.data, null, 2)
      );
      var data = response.data.items;
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        //console.log(element);

        var tmp_data = {};
        tmp_data.service = "youtube";
        tmp_data.v_id = element.id;
        tmp_data.owner = element.snippet.channelId;
        if (typeof element.snippet.thumbnails.standard != "undefined") {
          tmp_data.thumbnail = element.snippet.thumbnails.standard.url;
        } else {
          tmp_data.thumbnail = element.snippet.thumbnails.default.url;
        }
        tmp_data.title = element.snippet.title;
        tmp_data.description = element.snippet.description;
        tmp_data.privacyStatus = element.status.privacyStatus;
        tmp_data.publishedAt = moment(
          element.snippet.publishedAt
        ).toISOString();
        tmp_data.viewCount = element.statistics.viewCount;
        tmp_data.likeCount = element.statistics.likeCount;
        tmp_data.dislikeCount = element.statistics.dislikeCount;
        tmp_data.commentCount = element.statistics.commentCount;

        var m = await ow_videos
          .query()
          .where("service", tmp_data.service)
          .where("owner", tmp_data.owner)
          .where("v_id", tmp_data.v_id);

        if (m.length > 0) {
          await ow_videos
            .query()
            .patch(tmp_data)
            .where("service", tmp_data.service)
            .where("owner", tmp_data.owner)
            .where("v_id", tmp_data.v_id);
          //console.log("video patch: ", tmp_data.v_id);
        } else {
          console.log("video new: ", tmp_data.v_id);
          await ow_videos.query().insert(tmp_data);

          // TODO: Richtige Räume finden!
          // TODO: Nicht einfach jedes posten!
          /*
          var room = await Chat_Room.query().where({ is_announcement: true });
          for (let ri = 0; ri < room.length; ri++) {
            const element = room[ri];
            await FakeMsg(element.server, element.room, "!video " + tmp_data.v_id + "");
          }
          */
        }
      }

      if (data.length > 0 && nextPage) {
        q.push("Videos", () => {
          auth.credentials = sic;
          ListVideos(auth, pageToken + data.length);
        });
      }
    }
  );
}

function getBroadcast(socket, nextPageToken) {
  service.liveBroadcasts.list(
    {
      auth: socket.oauth2Client,
      part: "id, snippet, status",
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

      // Save to database
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

        if (element.status.privacyStatus != "public") {
          obj.liveChatId = "";
        }

        var m = await ow_broadcasts
          .query()
          .where("service", obj.service)
          .where("owner", obj.owner)
          .where("b_id", obj.b_id);

        if (m.length > 0) {
          await ow_broadcasts
            .query()
            .patch(obj)
            .where("service", obj.service)
            .where("owner", obj.owner)
            .where("b_id", obj.b_id);
        } else {
          await ow_broadcasts.query().insert(obj);
        }
      }
    }
  );
}

function getVideoDetails(socket, id) {
  service.videos.list(
    {
      auth: socket.oauth2Client,
      part: "id, snippet, statistics, status",
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

      // Save to database
      for (let index = 0; index < elemts.length; index++) {
        const element = elemts[index];

        var tmp_data = {};
        tmp_data.service = "youtube";
        tmp_data.v_id = element.id;
        tmp_data.owner = element.snippet.channelId;
        if (typeof element.snippet.thumbnails.standard != "undefined") {
          tmp_data.thumbnail = element.snippet.thumbnails.standard.url;
        } else {
          tmp_data.thumbnail = element.snippet.thumbnails.default.url;
        }
        tmp_data.title = element.snippet.title;
        tmp_data.description = element.snippet.description;
        tmp_data.privacyStatus = element.status.privacyStatus;
        tmp_data.publishedAt = moment(
          element.snippet.publishedAt
        ).toISOString();
        tmp_data.viewCount = element.statistics.viewCount;
        tmp_data.likeCount = element.statistics.likeCount;
        tmp_data.dislikeCount = element.statistics.dislikeCount;
        tmp_data.commentCount = element.statistics.commentCount;

        var m = await ow_videos
          .query()
          .where("service", tmp_data.service)
          .where("owner", tmp_data.owner)
          .where("v_id", tmp_data.v_id);

        if (m.length > 0) {
          await ow_videos
            .query()
            .patch(tmp_data)
            .where("service", tmp_data.service)
            .where("owner", tmp_data.owner)
            .where("v_id", tmp_data.v_id);
        } else {
          await ow_videos.query().insert(tmp_data);
        }
      }
    }
  );
}

async function getAnalyticsChannel(socket, args) {
  try {
    const data = await ow_channel.knex()
      .select("*")
      .from("channel_analytics_history")
      .where("channel_id", socket.oauth2Client.credentials.name)
      .orderBy("timestamp", "desc")
      .limit(1);

    if (data.length > 0) {
      socket.emit("AnalyticsChannel", { data: data[0] });
    } else {
      socket.emit("AnalyticsChannel", { data: null });
    }
  } catch (err) {
    socket.emit("API Error", "Database Error: " + err.message);
  }
}

async function getAnalyticsVideo(socket, args) {
  try {
    // Get latest analytics for each video of this channel
    const subquery = ow_videos.knex()
      .select("video_id")
      .max("timestamp as max_ts")
      .from("video_analytics_history")
      .where("channel_id", socket.oauth2Client.credentials.name)
      .groupBy("video_id");

    const data = await ow_videos.knex()
      .select("h.*")
      .from("video_analytics_history as h")
      .join(subquery.as("latest"), function() {
        this.on("h.video_id", "=", "latest.video_id").andOn("h.timestamp", "=", "latest.max_ts");
      })
      .orderBy("h.views", "desc")
      .limit(100);

    socket.emit("AnalyticsVideo", { data: { rows: data } });
  } catch (err) {
    socket.emit("API Error", "Database Error: " + err.message);
  }
}

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
  socket.oauth2Client.getToken(code, async function(err, token) {
    if (err) {
      socket.emit(
        "TOKEN Error",
        "Error while trying to retrieve access token: ",
        err
      );
      return;
    }
    socket.oauth2Client.credentials = token;

    // Save token to database
    try {
      var new_obj = {
        user_id: 1, // Default user_id as seen in reg.js
        service: "youtube",
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        scope: token.scope,
        token_type: token.token_type,
        expiry_date: token.expiry_date
      };

      // Check if token for this user and service already exists
      var existing = await Token.query().where({
        user_id: new_obj.user_id,
        service: new_obj.service
      });

      if (existing.length > 0) {
        await Token.query().patch(new_obj).where({ id: existing[0].id });
      } else {
        await Token.query().insert(new_obj);
      }
    } catch (e) {
      console.error("Error saving token:", e);
    }

    getSocketChannel(socket);
  });
}

function getSocketChannel(socket, pageToken = "") {
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
      socket.emit("channels", elemts);
    }
  );
}

io.on("connection", socket => {
  console.log("Socket Connection");

  var clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  var clientId = process.env.YOUTUBE_CLIENT_ID;
  var redirectUrl = process.env.YOUTUBE_CLINET_URI;

  socket.on("New", (cfg, new_scopes) => {
    if (typeof cfg != "undefined") {
      socket.oauth2Client = new OAuth2(
        cfg.clientId,
        cfg.clientSecret,
        cfg.redirectUrl
      );
    } else {
      socket.oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
    }
    getNewToken(socket, new_scopes);
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
    } else {
      socket.oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
    }

    socket.oauth2Client.credentials = JSON.parse(args);
    getSocketChannel(socket);
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

async function ImportChannelAnalytics(auth) {
  var q_startDate = moment()
    .subtract(90, "days")
    .format("YYYY-MM-DD");
  var q_endDate = moment()
    .subtract(14, "days")
    .format("YYYY-MM-DD");

  var sic = auth.credentials;
  var sic_user = sic.service_user;

  analytics.reports.query(
    {
      auth: auth,
      ids: "channel==MINE",
      startDate: q_startDate,
      endDate: q_endDate,
      metrics:
        "views,comments,likes,dislikes,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,grossRevenue,estimatedRevenue",
      dimensions: "day",
      sort: "day"
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      try {
        fs.writeFileSync(
          "tmp/report_channel_" + sic_user + ".json",
          JSON.stringify(response.data, null, 2)
        );

        var rows = response.data.rows;
        if (rows && rows.length > 0) {
          // Sum up the values for the period or just take the latest?
          // The request seems to imply getting the latest state or aggregation.
          // For channel stats like revenue and subscribers, we'll sum them up for the 90 day period to get a total,
          // or we could just take the last row if we want "current" stats.
          // Given the table structure, let's sum them or take the most recent day's aggregated totals if that's how it's used.
          // Looking at server.js, it just emits the whole thing.
          // Let's sum them up to reflect the totals in the channel table.

          let totalSubGained = 0;
          let totalSubLost = 0;
          let totalGrossRevenue = 0;
          let totalEstimatedRevenue = 0;

          for (let i = 0; i < rows.length; i++) {
            totalSubGained += rows[i][8];
            totalSubLost += rows[i][9];
            totalGrossRevenue += rows[i][10];
            totalEstimatedRevenue += rows[i][11];
          }

          var channel_data = {
            service: "youtube",
            channel_id: sic_user,
            views: rows.reduce((a, b) => a + b[1], 0),
            comments: rows.reduce((a, b) => a + b[2], 0),
            likes: rows.reduce((a, b) => a + b[3], 0),
            dislikes: rows.reduce((a, b) => a + b[4], 0),
            estimatedMinutesWatched: rows.reduce((a, b) => a + b[5], 0),
            averageViewDuration: rows.reduce((a, b) => a + Number(b[6]), 0) / rows.length,
            averageViewPercentage: rows.reduce((a, b) => a + Number(b[7]), 0) / rows.length,
            subscribersGained: totalSubGained,
            subscribersLost: totalSubLost,
            grossRevenue: totalGrossRevenue,
            estimatedRevenue: totalEstimatedRevenue,
            timestamp: new Date().toISOString()
          };

          await ow_channel.knex().insert(channel_data).into("channel_analytics_history");
        }
        console.log("Channel Analytics Import done for " + sic_user);
      } catch (e) {
        console.error(e);
      }
    }
  );
}

function ListChannels(auth, pageToken = "") {
  var sic = auth.credentials;
  service.channels.list(
    {
      auth: auth,
      part: "id, brandingSettings, contentDetails, snippet, statistics",
      mine: true,
      maxResults: 50,
      pageToken: pageToken
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      fs.writeFileSync(
        "tmp/channels.json",
        JSON.stringify(response.data, null, 2)
      );
      var data = response.data.items[0];
      var channel_obj = {};
      channel_obj.service = "youtube";
      channel_obj.user_id = sic.user_id;
      channel_obj.channel_id = data.id;
      channel_obj.channel_title = data.snippet.title;
      channel_obj.description = data.snippet.description;
      channel_obj.start_date = data.snippet.publishedAt;
      channel_obj.thumbnail = data.snippet.thumbnails.high.url;
      //channel_obj.banner = data.brandingSettings.image.bannerTvHighImageUrl;

      channel_obj.main_playlist = data.contentDetails.relatedPlaylists.uploads;
      channel_obj.views = data.statistics.viewCount;
      channel_obj.subscriber = data.statistics.subscriberCount;
      channel_obj.videos = data.statistics.videoCount;

      if (sic.service_user!=channel_obj.channel_id) {
        console.log("Change Token service_user, ", sic.id);
        await Token.query().where({id: sic.id}).patch({ service_user: channel_obj.channel_id, is_importing: false });
        process.exit(0);
      }


      {
        // Add Server
        var tmp_server = {};

        // Keys
        tmp_server.service = "youtube";
        tmp_server.server = channel_obj.channel_id;

        var g = await Chat_Server.query().where(tmp_server);

        // Additions
        tmp_server.owner = channel_obj.channel_id;
        tmp_server.name = "Livestream";
        if (g.length == 0) {
          console.log("Server: ", JSON.stringify(tmp_server));
          await Chat_Server.query().insert(tmp_server);
        } else {
          await Chat_Server.query()
            .patch(tmp_server)
            .where(g[0]);
        }
      }

      var m = await ow_channel
        .query()
        .where("service", channel_obj.service)
        .where("user_id", channel_obj.user_id)
        .where("channel_id", channel_obj.channel_id);

      if (m.length > 0) {
        await ow_channel
          .query()
          .patch(channel_obj)
          .where("service", channel_obj.service)
          .where("user_id", channel_obj.user_id)
          .where("channel_id", channel_obj.channel_id);
      } else {
        await ow_channel.query().insert(channel_obj);
        console.log("Channel: ", JSON.stringify(channel_obj));

        q.push("PlaylistsItems", () => {
          auth.credentials = sic;
          ListPlaylistItems(auth, channel_obj.main_playlist);
        });
      }
    }
  );
}
function ListPlaylists(auth, pageToken = "") {
  var sic = auth.credentials;
  service.playlists.list(
    {
      auth: auth,
      part: "id, snippet",
      mine: true,
      maxResults: 50,
      pageToken: pageToken
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      fs.writeFileSync(
        "tmp/playlists.json",
        JSON.stringify(response.data, null, 2)
      );
      var data = response.data.items;
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        var tmp_message = {};
        tmp_message.service = "youtube";
        tmp_message.owner = element.snippet.channelId;
        tmp_message.pl_id = element.id;
        tmp_message.pl_title = element.snippet.title;
        tmp_message.publishedAt = element.snippet.publishedAt;
        tmp_message.description = element.snippet.description;

        var m = await ow_playlist
          .query()
          .where("service", tmp_message.service)
          .where("owner", tmp_message.owner)
          .where("pl_id", tmp_message.pl_id);

        if (m.length > 0) {
          await ow_playlist
            .query()
            .patch(tmp_message)
            .where("service", tmp_message.service)
            .where("owner", tmp_message.owner)
            .where("pl_id", tmp_message.pl_id);
        } else {
          await ow_playlist.query().insert(tmp_message);
          console.log("PlayList: ", JSON.stringify(tmp_message));
        }
        q.push("PlaylistsItems", () => {
          auth.credentials = sic;
          ListPlaylistItems(auth, tmp_message.pl_id);
        });
      }
      if (typeof response.data.nextPageToken != "undefined") {
        q.push("Playlists", () => {
          auth.credentials = sic;
          ListPlaylists(auth, response.data.nextPageToken);
        });
      }
    }
  );
}
async function ListNewUploads(auth) {
  var sic = auth.credentials;
  var data = await ow_channel
    .query()
    .where("user_id", auth.credentials.user_id);
  if (data.length == 0) return;
  if (data[0].main_playlist == "") return;
  q.push("PlaylistsItems Upload", () => {
    auth.credentials = sic;
    ListPlaylistItems(auth, data[0].main_playlist, "", false);
  });
  q.push("Videos Upload", () => {
    auth.credentials = sic;
    ListVideos(auth, 0, false);
  });
}

function ListPlaylistItems(auth, playlist, pageToken = "", loadAll = true) {
  var sic = auth.credentials;
  service.playlistItems.list(
    {
      auth: auth,
      part: "snippet",
      playlistId: playlist,
      maxResults: 50,
      pageToken: pageToken
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      fs.writeFileSync(
        "tmp/playlistsitems.json",
        JSON.stringify(response.data, null, 2)
      );
      var data = response.data.items;
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        var tmp_message = {};
        tmp_message.service = "youtube";
        tmp_message.owner = element.snippet.channelId;
        tmp_message.pl_id = playlist;
        tmp_message.position = element.snippet.position;
        tmp_message.video_Id = element.snippet.resourceId.videoId;

        var m = await ow_playlistitems
          .query()
          .where("service", tmp_message.service)
          .where("owner", tmp_message.owner)
          .where("pl_id", tmp_message.pl_id)
          .where("position", tmp_message.position);

        if (m.length > 0) {
          await ow_playlistitems
            .query()
            .patch(tmp_message)
            .where("service", tmp_message.service)
            .where("owner", tmp_message.owner)
            .where("pl_id", tmp_message.pl_id)
            .where("position", tmp_message.position);
          //console.log("Update PlayList Item: ", JSON.stringify(tmp_message));
        } else {
          await ow_playlistitems.query().insert(tmp_message);
          console.log("PlayList Item: ", JSON.stringify(tmp_message));
        }
      }
      if (
        typeof response.data.nextPageToken != "undefined" &&
        loadAll == true
      ) {
        q.push("PlaylistsItems", () => {
          auth.credentials = sic;
          ListPlaylistItems(auth, playlist, response.data.nextPageToken);
        });
      }
    }
  );
}
function SearchBroadcasts(auth, pageToken = "") {
  var sic = auth.credentials;
  service.liveBroadcasts.list(
    //service.liveStreams.list(
    {
      auth: auth,
      part: "id, snippet, status",
      mine: true,
      maxResults: 50,
      pageToken: pageToken
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      try {
        fs.writeFileSync(
          "tmp/liveBroadcasts.json",
          JSON.stringify(response.data, null, 2)
        );

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

          if (element.status.privacyStatus != "public") {
            obj.liveChatId = "";
          }

          {
            // Add Room
            var tmp_room = {};

            // Keys
            tmp_room.service = "youtube";
            tmp_room.server = obj.owner;
            tmp_room.room = obj.liveChatId;

            var c = await Chat_Room.query().where(tmp_room);

            // Additions
            tmp_room.name = obj.b_title;
            tmp_room.is_rpg = true;
            if (obj.b_title.toLowerCase().includes("sponsored")) {
              tmp_room.is_rpg = false;
            }
            if (tmp_room.server != "UC5DOhI70dI3PnLPMkUsosgw") {
              // ToDo: Born Things
              tmp_room.is_rpg = false;
            }

            if (c.length == 0) {
              console.log("Room: ", JSON.stringify(tmp_room));
              await Chat_Room.query().insert(tmp_room);

              // Add Spawn?
              if (tmp_room.server == "UC5DOhI70dI3PnLPMkUsosgw") {
                // ToDo: Born Things
                await FakeMsg(tmp_room.server, tmp_room.room, "?spawn");
                await FakeMsg(
                  tmp_room.server,
                  tmp_room.room,
                  "!announcement Livestream: https://www.youtube.com/watch?v=" +
                    obj.b_id +
                    ""
                );
              }
            } else {
              if (obj.actualEndTime != null) {
                tmp_room.is_rpg = false;
              }
              await Chat_Room.query()
                .patch(tmp_room)
                .where(c[0]);
            }
          }

          var m = await ow_broadcasts
            .query()
            .where("service", obj.service)
            .where("owner", obj.owner)
            .where("b_id", obj.b_id);

          if (m.length > 0) {
            await ow_broadcasts
              .query()
              .patch(obj)
              .where("service", obj.service)
              .where("owner", obj.owner)
              .where("b_id", obj.b_id);
          } else {
            console.log("Broadcast: ", obj);
            await ow_broadcasts.query().insert(obj);
          }
        }

        // Update Last Stream-Chats?
        var Stream_RPG_Chats = await Chat_Room.query()
          .where("server", sic.service_user)
          .where("service", "youtube")
          .where("is_rpg", true);
        for (
          let rpg_chat_index = 0;
          rpg_chat_index < Stream_RPG_Chats.length;
          rpg_chat_index++
        ) {
          const element = Stream_RPG_Chats[rpg_chat_index];
          console.log("Checking", element.name);
          var HasLiveStream = await ow_broadcasts
            .query()
            .where("liveChatId", element.room);
          if (HasLiveStream.length == 0) {
            element.is_rpg = false;
            await Chat_Room.query()
              .patch(element)
              .where("service", element.service)
              .where("server", element.server)
              .where("room", element.room);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  );
}

async function LiveChat(auth, pageToken = "") {
  //console.log(auth);
  var sic = auth.credentials;
  var data = await ow_channel
    .query()
    .where("channel_id", auth.credentials.service_user)
    .where("service", "youtube")
    .eager("Livestream")
    .modifyEager("Livestream", builder => {
      // Order children by age and only select id.
      builder
        .where("liveChatId", "!=", "")
        .whereNotNull("liveChatId")
        .where("actualStartTime", "<", moment().toISOString())
        .whereNull("actualEndTime");
    });
  if (
    data.length==0 ||
    typeof data[0].Livestream == "undefined" ||
    typeof data[0].Livestream[0] == "undefined"
  ) {
    //console.log("Kein Livestream");
    setTimeout(() => {
      q.push("LiveChat", () => {
        auth.credentials = sic;
        LiveChat(auth);
      });
    }, RepeatDealy);
    return;
  }
  console.log("LiveChat: ", data[0].Livestream[0].b_id);
  service.liveChatMessages.list(
    {
      auth: auth,
      part: "snippet, authorDetails",
      liveChatId: data[0].Livestream[0].liveChatId,
      pageToken: pageToken,
      maxResults: 2000
    },
    async function(err, response) {
      if (err) {
        if (err.response.status==404) {
          //await ow_broadcasts.query().delete().where("b_id", data[0].Livestream[0].b_id);
          console.log("LiveChat not Found! ", data[0].Livestream[0].b_id);
        } else if (err.response.status==403) {
          await ow_broadcasts.query().delete().where("b_id", data[0].Livestream[0].b_id);
          console.log("LiveChat Forbidden! ", data[0].Livestream[0].b_id);
        } else {
          console.error(err);
        }

        await ow_broadcasts
          .query()
          .patch({liveChatId: ""})
          .where("b_id", data[0].Livestream[0].b_id);

        q.push("Broadcasts", () => {
          auth.credentials = sic;
          SearchBroadcasts(auth);
        });
        q.push("LiveChat", () => {
          auth.credentials = sic;
          LiveChat(auth);
        });

        return;
      }
      try {
        fs.writeFileSync(
          "tmp/chat.json",
          JSON.stringify(response.data, null, 2)
        );
        var txt = response.data.items;
        /*
        if (txt.length > 0) {
          fs.writeFileSync(
            "tmp/chat.json",
            JSON.stringify(response.data, null, 2)
          );
        }
        */
        for (let index = 0; index < txt.length; index++) {
          const element = txt[index];

          var tmp_message = {};

          // Keys
          tmp_message.service = "youtube";
          tmp_message.server = data[0].channel_id;
          tmp_message.room = data[0].Livestream[0].liveChatId;
          tmp_message.id = element.id;

          var m = await Chat_Message.query().where(tmp_message);
          // Additons
          tmp_message.user = element.snippet.authorChannelId;
          tmp_message.timestamp = element.snippet.publishedAt;
          tmp_message.content = element.snippet.displayMessage;

          if (m.length == 0) {
            console.log("Message: ", JSON.stringify(tmp_message));
            await Chat_Message.query().insert(tmp_message);
            if (element.snippet.type == "newSponsorEvent") {
              // Neuer Sponsor
              await FakeMsg(
                tmp_message.server,
                tmp_message.room,
                "!party Willkommen @" + element.authorDetails.displayName
              );
            }
          } else {
            //console.log('Message Repeat:', JSON.stringify(tmp_message));
            try {
              await Chat_Message.query()
                .patch(tmp_message)
                .where(m[0]);
              if (element.snippet.type == "newSponsorEvent") {
                // Neuer Sponsor
                await FakeMsg(
                  tmp_message.server,
                  tmp_message.room,
                  "!party Willkommen @" + element.authorDetails.displayName
                );
              }
            } catch (e) {
              console.error(e);
            }
          }
          await sleep(1000);

          {
            // USER
            var tmp_user = {};

            // Keys
            tmp_user.service = "youtube";
            tmp_user.server = data[0].channel_id;
            tmp_user.user = element.snippet.authorChannelId;

            var u = await Chat_User.query().where(tmp_user);

            // Additions
            tmp_user.name = element.authorDetails.displayName;
            tmp_user.profile_picture = element.authorDetails.profileImageUrl;

            if (u.length == 0) {
              await Chat_User.query().insert(tmp_user);
              console.log("User: ", JSON.stringify(tmp_user));
            } else {
              await Chat_User.query()
                .patch(tmp_user)
                .where(u[0]);
            }
          }
        }

        if (pageToken == "") {
          fs.writeFileSync(
            "tmp/chat.json",
            JSON.stringify(response.data, null, 2)
          );
        }
        if (typeof response.data.nextPageToken != "undefined") {
          setTimeout(() => {
            q.push("LiveChat", () => {
              auth.credentials = sic;
              LiveChat(auth, response.data.nextPageToken);
            });
          }, RepeatDealy);
        }
      } catch (e) {
        console.error(e);
        setTimeout(() => {
          q.push("LiveChat", () => {
            auth.credentials = sic;
            LiveChat(auth);
          });
        }, RepeatDealy);
      }
    }
  );
}

function ListMembers(auth, pageToken = "") {
  var sic = auth.credentials;
  //console.log("ListMembers",sic);
  service.members.list(
    {
      auth: auth,
      part: "snippet",
      maxResults: 1000
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      try {
        fs.writeFileSync(
          "tmp/members.json",
          JSON.stringify(response.data, null, 2)
        );

        var txt = response.data.items;
        for (let index = 0; index < txt.length; index++) {
          var element = txt[index].snippet;
          var tmp_message = {};
          tmp_message.service = "youtube";
          tmp_message.owner = element.creatorChannelId;
          if (typeof element.memberDetails == "undefined") {
            tmp_message.owner = "SYTH";
            tmp_message.member_id = element.creatorChannelId;
            tmp_message.member_name = "SYTH: Error Account Data API";
            tmp_message.picture = "";
            tmp_message.level = "";
          } else {
            tmp_message.member_id = element.memberDetails.channelId;
            tmp_message.member_name = element.memberDetails.displayName;
            tmp_message.picture = element.memberDetails.profileImageUrl;
            tmp_message.level =
              element.membershipsDetails.highestAccessibleLevelDisplayName;
          }

          var m = await sponsors
            .query()
            .where("service", tmp_message.service)
            .where("owner", tmp_message.owner)
            .where("member_id", tmp_message.member_id);

          tmp_message.since =
            element.membershipsDetails.membershipsDuration.memberSince;

          tmp_message.current =
            element.membershipsDetails.membershipsDuration.memberTotalDurationMonths;
          tmp_message.points = 0;

          pointarr = element.membershipsDetails.membershipsDurationAtLevels;
          for (
            let pointarr_cnt = 0;
            pointarr_cnt < pointarr.length;
            pointarr_cnt++
          ) {
            tmp_message.points +=
              pointarr[pointarr_cnt].memberTotalDurationMonths;
          }

          if (m.length > 0) {
            await sponsors
              .query()
              .patch(tmp_message)
              .where("service", tmp_message.service)
              .where("owner", tmp_message.owner)
              .where("member_id", tmp_message.member_id);
            //console.log("Update Sponsor: ", JSON.stringify(tmp_message));
          } else {
            await sponsors.query().insert(tmp_message);
            console.log("Sponsor: ", JSON.stringify(tmp_message));
          }
        }
        /* if (
          typeof response.data.nextPageToken != "undefined" &&
          response.data.nextPageToken != ""
        ) {
          console.log(response.data.nextPageToken);
          setTimeout(() => {
            q.push("Sponsors", () => {
              auth.credentials = sic;
              ListSponsors(auth, response.data.nextPageToken);
            });
          }, 1000 * 5);
        }*/
        var date = new Date();
        date.setDate(date.getDate() - 7);

        await sponsors
          .query()
          .delete()
          .where("updated_at", "<", date.toISOString());
      } catch (e) {
        console.error(e);
      }
    }
  );
}

async function CheckForMessages(auth) {
  var sic = auth.credentials;

  var msgs = await Outgoing_Message.query().where("service", "youtube");
  //console.log("MSGS: " + msgs.length);
  if (msgs.length > 0) {
    for (var i = 0; i < msgs.length; i++) {
      await SendMessage(auth, msgs[i].room, emoji.emojify(msgs[i].content));
      await Outgoing_Message.query()
        .delete()
        .where(msgs[i]);
    }
  }
  setTimeout(() => {
    auth.credentials = sic;
    CheckForMessages(auth);
  }, 100);
}
async function SendMessage(auth, channelID, msg) {
  console.log("Try to Send Message");
  writeChat(auth, channelID, msg);
}
function writeChat(auth, chatId, Message) {
  var sic = auth.credentials;
  service.liveChatMessages.insert(
    {
      auth: auth,
      part: "snippet",
      resource: {
        snippet: {
          type: "textMessageEvent",
          liveChatId: chatId,
          textMessageDetails: {
            messageText: Message
          }
        }
      }
    },
    function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      fs.writeFileSync(
        "tmp/chat_post.json",
        JSON.stringify(response.data, null, 2)
      );
      console.log("Post: ", Message);
    }
  );
}

async function FakeMsg(server, room, content) {
  var tmp_message = {};

  // Keys
  tmp_message.service = "youtube";
  tmp_message.server = server;
  tmp_message.room = room;
  tmp_message.id = new Date();

  var m = await Chat_Message.query().where(tmp_message);
  // Additons
  tmp_message.user = server;
  tmp_message.timestamp = new Date();
  tmp_message.content = content;

  if (m.length == 0) {
    console.log("Fake-Message: ", JSON.stringify(tmp_message));
    await Chat_Message.query().insert(tmp_message);
    await sleep(1000);
  } else {
    FakeMsg(server, room, content);
  }
}

async function ImportAnalytics(auth) {
  var q_startDate = moment()
    .subtract(90, "days")
    .format("YYYY-MM-DD");
  var q_endDate = moment()
    .subtract(14, "days")
    .format("YYYY-MM-DD");

  var sic = auth.credentials;
  var sic_user = sic.service_user;

  analytics.reports.query(
    {
      auth: auth,
      ids: "channel==MINE",
      startDate: q_startDate,
      endDate: q_endDate,
      metrics:
        "views,estimatedMinutesWatched,comments,likes,dislikes,averageViewDuration,averageViewPercentage",
      dimensions: "video",
      sort: "-views",
      maxResults: 200 // Increased from 100
    },
    async function(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      try {
        fs.writeFileSync(
          "tmp/report_" + sic_user + ".json",
          JSON.stringify(response.data, null, 2)
        );

        var rows = response.data.rows;
        if (rows) {
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const video_id = row[0];
            const views = row[1];
            const estimatedMinutesWatched = row[2];
            const comments = row[3];
            const likes = row[4];
            const dislikes = row[5];
            const averageViewDuration = row[6];
            const averageViewPercentage = row[7];

            var tmp_data = {
              service: "youtube",
              channel_id: sic_user,
              video_id: video_id,
              views: views,
              estimatedMinutesWatched: estimatedMinutesWatched,
              comments: comments,
              likes: likes,
              dislikes: dislikes,
              averageViewDuration: averageViewDuration,
              averageViewPercentage: averageViewPercentage,
              timestamp: new Date().toISOString()
            };

            await ow_videos.knex().insert(tmp_data).into("video_analytics_history");
          }
        }
        console.log("Analytics Import done for " + sic_user);
      } catch (e) {
        console.error(e);
      }
    }
  );
}
