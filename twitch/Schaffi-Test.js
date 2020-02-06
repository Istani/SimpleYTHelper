process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require("dotenv").config({ path: "../.env" });

const moment = require("moment");
const cron = require("node-cron");
const fs = require("fs");
const tmi = require("tmi.js");
const client = new tmi.Client({
  options: { debug: false },
  connection: {
    reconnect: true,
    secure: true
  },
  identity: {
    // https://twitchapps.com/tmi/
    username: "istani",
    password: "oauth:8fo5eh9oaalekytdjscjxnkvfx7wcr"
    //username: process.env.TWITCH_Login,
    //password: process.env.TWITCH_Passwort
  },
  channels: ["#schaffi"]
});
client.connect();
client.on("message", (channel, tags, message, self) => {
  var channel = channel.replace("#", "");
  if (message == "!fail") {
    if (typeof settings.deathcounter == "undefined") {
      settings.deathcounter = {};
    }
    if (typeof settings.deathcounter[channel] == "undefined") {
      settings.deathcounter[channel] = 0;
    }
    settings.deathcounter[channel]++;
    save_settings();
    setTimeout(() => {
      client.say(channel, "FailCounter: " + settings.deathcounter[channel]);
    }, 1000);
  }
  console.log(channel.replace("#", ""), message);
});
var settings = {};
function load_settings() {
  try {
    settings = require("./temp/settings.json");
  } catch (error) {
    console.error("Settings", "Couldn't load!");
    settings = {};
  }
}
function save_settings() {
  var data = JSON.stringify(settings);
  console.log(settings, data);
  fs.writeFileSync("./temp/settings.json", data);
  //load_settings();
}
load_settings();

cron.schedule("*/5 * * * *", () => {
  var dat = moment().format("H:mm");
  console.log(dat);
  client.say("schaffi", dat + " schaffHype Du schaffst es!");
});
