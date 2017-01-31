// Fake Discord Like Google Bot
// -> Damit das einheitlicher im Bot verwendet werden kann!
var events = require('events')
var util = require('util');

// Google Daten
var google = require('googleapis');
var youtube = google.youtube('v3');

var OAuth2Client = google.auth.OAuth2;
var CLIENT_ID     = '';
var CLIENT_SECRET = '';
var REDIRECT_URL  = 'http://simpleyth.randompeople.de/index.php';
var oauth2Client;


// Constructor
var Google_Bot = function(MySQL) {
  this.mysql=MySQL;
  this.user="bla";
};
Google_Bot.prototype = new events.EventEmitter;

Google_Bot.prototype.login = function(client_id, client_secret, access_token) {
  var self = this;
  setInterval(function() {
    RefreshToken(self);
  }, 500);
  
  setTimeout(function() {
    setInterval(function() {
      CheckMessage(self);
    }, 100);
  },1000);
  
  // TODO: Finde besseren Platz für:
  self.emit('ready');
};

Google_Bot.prototype.sendMessage = function (room, text) {
  var self = this;
  youtube.liveChatMessages.insert({
    auth:oauth2Client,
    part:'snippet',
    resource:{
      snippet:{
        type:"textMessageEvent",
        liveChatId:""+room+"",
        textMessageDetails:{
          messageText:text
        }
      }
    }
  }, function(err,response){
    if (err) {
      console.log('The Google API returned an error: ' + err + '\n' + text);
      return;
    }
  });
  console.log(room + " - " + this.user + ": " + text);
}

function SetLogin(self, client_id, client_secret, access_token) {
  CLIENT_ID=client_id;
  CLIENT_SECRET=client_secret;
  
  oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
  oauth2Client.setCredentials({access_token: access_token});
  
  youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client
  });
}

function RefreshToken(self) {
  var LoadToken_String = "SELECT * FROM authtoken WHERE is_bot = '1' LIMIT 1";
  self.mysql.query(LoadToken_String, function (err, rows) {
    if (err != null) {
      console.log("MySQL: " + err);
      return;
    }
    for (var i = 0; i < rows.length; i++) {
      SetLogin(self, rows[i].google_clientid,rows[i].google_clientsecret,rows[i].access_token);
    }
  });
}

function CheckMessage(self) {
  var SQL_STRING = "SELECT * FROM livestream_chat WHERE `ignore` = '0' ORDER BY publishedAt LIMIT 1";
  self.mysql.query(SQL_STRING, function (err, rows) {
    if (err != null) {
      console.log("MySQL: " + err);
      return;
    }
    for (var i = 0; i < rows.length; i++) {
      var msg_line = rows[i];
      var SQL_UPDATE ="UPDATE livestream_chat SET `ignore`='1' WHERE id='" + msg_line.id + "'";
      self.mysql.query(SQL_UPDATE, function (err, rows) {
        if (err != null) {
          console.log("MySQL: " + err);
          return;
        }
        // NOTE: Add more information for Author Log (and more)
        var role="User";
        if (msg_line.ischatmoderator=="1") {
          role="Moderator";
        }
        if (msg_line.ischatowner=="1") {
          role="Admin";
        }
        var msg = {
          host:msg_line.channel_id,
          room: msg_line.livechatid,
          id: msg_line.id,
          //TODO: createdTimestamp:msg_line.publishedat.toDate(),
          author:msg_line.authorchannelid,
          authorname:msg_line.displayname,
          content: msg_line.displaymessage,
          
          misc: msg_line
        };
        self.emit('message', msg);
      });
    }
  });
};


module.exports = Google_Bot;
