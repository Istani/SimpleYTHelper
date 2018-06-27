const Discord = require('discord.js');
const client = new Discord.Client();

const config = require('dotenv').config();
const db = require('./db.js');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('Pong!');
  }
});
db.query("SELECT user_token FROM simpleyth_oauth_botcredentials WHERE service='discord'", function (err, result) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  client.login(result[0].user_token);
});