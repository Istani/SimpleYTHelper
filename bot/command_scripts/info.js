var self = module.exports = {
  execute: function (message_row, SendFunc, NewMessageFunc) {
    var string="Hallo, ich bin der Simple YouTubeHelper Bot!\r\n";
    string=string+"Hier folgt ein Info Text!\r\n";
    SendFunc(string);
    string="";
    string=string+"Homepage: http://simpleyth.randompeople.de\n\r";
    SendFunc(string);
    string="";
    string=string+"Invite: https://discordapp.com/oauth2/authorize?client_id=225365144497029125&scope=bot&permissions=-1\n\r";
    SendFunc(string);
    string="";
  },
};
