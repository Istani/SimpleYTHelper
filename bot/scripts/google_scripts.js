var parent;
var google = require('googleapis');
var youtube = google.youtube('v3');

var OAuth2Client = google.auth.OAuth2;
var CLIENT_ID     = '';
var CLIENT_SECRET = '';
var REDIRECT_URL  = 'http://simpleyth.randompeople.de/index.php';
var oauth2Client;

var ist_gestartet=false;

var self = module.exports = {
  init: function (me) {
    parent=me;
  },
  client: function (tmp_client_id, tmp_client_secret, tmp_access_token) {
    CLIENT_ID=tmp_client_id;
    CLIENT_SECRET=tmp_client_secret;
    
    oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
    oauth2Client.setCredentials({access_token: tmp_access_token});
    
    youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });
    
    ist_gestartet=true;
  },
  is_started: function () {
    return ist_gestartet;
  },
  sendMessage: function (msg, streamBroadcastChatId) {
    youtube.liveChatMessages.insert({
      auth:oauth2Client,
      part:'snippet',
      resource:{
        snippet:{
          type:"textMessageEvent",
          liveChatId:""+streamBroadcastChatId+"",
          textMessageDetails:{
            messageText:msg
          }
        }
      }
    }, function(err,response){
      if (err) {
        parent('The Google API returned an error: ' + err);
        return;
      } else {
        //
      }
    });
  },
}
