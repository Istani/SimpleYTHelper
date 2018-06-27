const Discord = require('discord.js');
const client = new Discord.Client();

const config = require('dotenv').config();
const db = require('./db.js');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('error', err => {
  console.log("Client Error", err);
  process.exit(1);
});

client.on('disconnect', event => {
  console.log("Client Event", "Disconnect");
  process.exit(1);
});

db.query("SELECT user_token FROM simpleyth_oauth_botcredentials WHERE service='discord'", function (err, result) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  if (result.length == 0) {
    console.log("Entry Discord-Token Missing");
    process.exit(1);
  }
  client.login(result[0].user_token).catch(function (err) {
    if (err) {
      console.log("Client Login", err.code);
      process.exit(1);
    }
  });
});

/* Custom Stuff */
client.on('message', msg => {
  console.log("MSG:", msg);
});

