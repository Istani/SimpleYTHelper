process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");

var envpath = __dirname + "/../.env";
console.log("Settingspath:", envpath);
var config = require("dotenv").config({ path: envpath });
var tc = require("tinder-client");

console.log();
try {
  (async function main() {
    const client = await tc.createClientFromFacebookLogin({
      emailAddress: process.env.FACEBOOK_LOGIN,
      password: process.env.FACEBOOK_PASS
    });

    await set_location(client);
    setInterval(() => {
      set_location(client);
    }, 1000 * 60 * 15);

    set_likes(client);
  })();

  async function set_location(client) {
    var tc = require("tinder-client");
    console.log("Update Profile Start");

    var profile = await client.getProfile();
    var my_year = new Date().getFullYear();
    var my_birthday = new Date(profile.birth_date).getFullYear();
    var min_age = my_year - my_birthday - 6;
    var max_age = my_year - my_birthday + 4;

    //await client.changeLocation({ latitude: '50.4567742', longitude: '7.4893209' });
    await client.changeLocation({
      latitude: "50.714550",
      longitude: "7.557150"
    });
    await client.updateProfile({
      userGender: 0,
      searchPreferences: {
        minimumAge: 0,
        maximumAge: max_age,
        genderPreference: 1,
        maximumRangeInKilometers: 100
      }
    });

    var profile = await client.getProfile();
    await save_file("_Profile", profile);
    const myMetadata = await client.getMetadata();
    await save_file("_Meta", myMetadata);
    console.log("Update Profile End");
  }

  async function set_likes(client) {
    console.log("Send Likes Start");
    var resp = {};
    resp.likes_remaining = 1;
    while (resp.likes_remaining > 0) {
      const recommendations = await client.getRecommendations();
      console.log("Like Recommendations:", recommendations.results.length);

      for (var i = 0; i < recommendations.results.length; i++) {
        var perso = recommendations.results[i];
        var is_new = await save_file("P_" + perso._id, perso, true);

        if (is_new) {
          resp = await client.like(perso._id);
          console.log("Like: ", perso.name);

          if (resp.likes_remaining == 0) {
            break;
          }
        } else {
          console.error("Already: ", perso.name);
        }
      }
    }
    var d = new Date(resp.rate_limited_until) - new Date() + 1000;
    if (d > 0) {
      setTimeout(() => {
        set_likes(client);
      }, d);
    } else {
      set_likes(client);
    }
    console.log("Send Likes Ende");
  }

  async function save_file(name, data, only_new = false) {
    var filename = "./tmp/" + name + ".json";
    var fs = require("fs");
    if (fs.existsSync(filename)) {
      if (only_new) {
        return false;
      }
      fs.unlinkSync(filename);
    }
    fs.writeFileSync(filename, JSON.stringify(data));
    return true;
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}
