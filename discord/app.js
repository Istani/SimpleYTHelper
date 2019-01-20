process.chdir(__dirname);
const package_info = require('./package.json');
var software=package_info.name+" (V "+package_info.version+")";
console.log(software);
console.log("===");
console.log();
const config = require('dotenv').config({path: '../.env'});

const Discord = require('discord.js');
const client = new Discord.Client();

client.login(process.env.DISCORD_TOKEN).catch(function (error) {
  if (error) {
    console.log("Client Login", error);
    process.exit(1);
  }
});

client.on('ready', () => {
  console.log(`Logged in as <${client.user.tag}>!`);
  client.user.setActivity('SYTH').then(presence => { console.log(`Activity set to ${presence.game ? presence.game.name : 'none'}`); }).catch(console.error);
});

client.on('error', error => {
  console.log("Client Error", error);
  process.exit(1);
});

client.on('disconnect', event => {
  console.log("Client Event", "Disconnect");
  process.exit(1);
});

/* Custom Stuff */
client.on('message', msg => {
  console.log("MSG:", msg);
});

