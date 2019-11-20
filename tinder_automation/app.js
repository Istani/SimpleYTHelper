process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");

var envpath = __dirname + "/../.env";
console.log("Settingspath:", envpath);
var config = require("dotenv").config({ path: envpath });
var tc = require("tinder-client");

var express = require("express");
var exphbs = require("express-handlebars");

var profiles = [];
var dif = 0;

// Start Site
var hbs = exphbs.create({
  helpers: {
    checkPrice: function(low, high, options) {
      if (low == high) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  },
  defaultLayout: "main",
  extname: ".hbs"
});

var app = express();
app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");
app.use(express.static("public"));
app.get("/", function(req, res) {
  profiles.sort(function(a, b) {
    return a.distance_mi - b.distance_mi;
  });
  res.render("home", { page_title: "Home", profs: profiles });
});

app.listen(3003, () => console.log("Interface on 3003!"));

console.log();
try {
  (async function main() {
    data();

    const client = await tc.createClientFromFacebookLogin({
      emailAddress: process.env.FACEBOOK_LOGIN,
      password: process.env.FACEBOOK_PASS
    });

    await set_location(client);

    set_likes(client);
  })();

  async function set_location(client) {
    var tc = require("tinder-client");
    console.log("Update Profile Start");

    var profile = await client.getProfile();
    var my_year = new Date().getFullYear();
    var my_birthday = new Date(profile.birth_date).getFullYear();
    var min_age = my_year - my_birthday - 8;
    var max_age = my_year - my_birthday + 5;

    /*await client.changeLocation({
      latitude: "50.714550",
      longitude: "7.557150"
    });*/
    await client.changeLocation({
      latitude: "50.4567742",
      longitude: "7.4893209"
    });
    /*await client.updateProfile({
      userGender: 0,
      searchPreferences: {
        minimumAge: 0,
        maximumAge: max_age,
        genderPreference: 1,
        maximumRangeInKilometers: 1 + dif
      }
    });*/
    await client.updateProfile({
      userGender: 0,
      searchPreferences: {
        minimumAge: 0,
        maximumAge: 99,
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

  async function set_next(client) {
    dif++;
    await set_location(client);
    set_likes(client);
    console.log("Send Likes Ende - Next");
  }
  async function set_likes(client) {
    console.log("Send Likes Start");
    var resp = {};
    resp.likes_remaining = 1;
    while (resp.likes_remaining > 0) {
      const recommendations = await client.getRecommendations();
      if (typeof recommendations == "undefined") {
        setTimeout(() => {
          set_next(client);
        }, 100);
        return;
      }
      if (typeof recommendations.results == "undefined") {
        setTimeout(() => {
          set_next(client);
        }, 100);
        return;
      }
      if (typeof recommendations.results.length == "undefined") {
        setTimeout(() => {
          set_next(client);
        }, 100);
        return;
      }
      console.log("Like Recommendations:", recommendations.results.length);

      for (var i = 0; i < recommendations.results.length; i++) {
        var perso = recommendations.results[i];
        var is_new = await save_file("P_" + perso._id, perso, true);

        if (is_new) {
          resp = await client.like(perso._id);
          console.log("Like: ", perso.name);

          if (resp.likes_remaining == 0) {
            remove_file("P_" + perso._id);
            break;
          }
        } else {
          console.error("Already: ", perso.name);
          dif++;
          await set_location(client);
        }
      }
    }
    var d = new Date(resp.rate_limited_until) - new Date() + 1000;
    if (d > 0) {
      console.log(
        "Break Until",
        new Date(resp.rate_limited_until),
        ":",
        d,
        "Sec"
      );
      setTimeout(() => {
        set_likes(client);
      }, d);
    } else {
      set_likes(client);
    }
    data();
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
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    return true;
  }
  async function remove_file(name) {
    var filename = "./tmp/" + name + ".json";
    var fs = require("fs");
    if (fs.existsSync(filename)) {
      fs.unlinkSync(filename);
    }
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}

async function data() {
  try {
    var fs = require("fs");
    profiles = [];
    var dirname = "tmp/";
    fs.readdir(dirname, function(err, filenames) {
      if (err) {
        console.error(err);
        return;
      }
      filenames.forEach(function(filename) {
        if (filename.startsWith("P_")) {
          fs.readFile(dirname + filename, "utf-8", function(err, content) {
            if (err) {
              console.error(err);
              return;
            }
            profiles.push(JSON.parse(content));
          });
        }
      });
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
