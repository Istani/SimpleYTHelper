process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");

var envpath = __dirname + "/../.env";
console.log("Settingspath:", envpath);
var config = require("dotenv").config({ path: envpath });

var tc = require("tinder-client");
var queue = require("better-queue");
var cron = require("node-cron");
var exec = require("child_process").execSync;

var q = new queue(function(input, cb) {
  input(cb);
});

var dif = 0;
var profile = {};
try {
  profile = require("./tmp/_Profile.json");
} catch (e) {}
var meta = {};
try {
  meta = require("./tmp/_Meta.json");
} catch (e) {}

async function main() {
  try {
    const client = await tc.createClientFromFacebookLogin({
      emailAddress: process.env.FACEBOOK_LOGIN,
      password: process.env.FACEBOOK_PASS
    });

    q.push(cb => {
      set_location(client, cb);
    });
  } catch (e) {
    console.error(e);
    q.push(cb => {
      NeustartUndSo();
    });
  }
}
main();

cron.schedule("00 */1 * * * ", () => {
  q.push(cb => {
    NeustartUndSo();
  });
});

function NeustartUndSo() {
  console.log("Restart in 5 Min!");
  setTimeout(() => {
    process.exit(0);
  }, 1000 * 60 * 5);
}

async function set_location(client, cb) {
  console.log("Update Profile Start");

  profile = await client.getProfile();
  var my_year = new Date().getFullYear();
  var my_birthday = new Date(profile.birth_date).getFullYear();
  var min_age = my_year - my_birthday - 8;
  var max_age = my_year - my_birthday + 5;

  await client.changeLocation({
    latitude: "50.714550",
    longitude: "7.557150"
  });
  if (dif >= 100) {
    await client.updateProfile({
      userGender: 0,
      searchPreferences: {
        minimumAge: 0,
        maximumAge: 99,
        genderPreference: 1,
        maximumRangeInKilometers: 999
      }
    });
  } else {
    await client.updateProfile({
      userGender: 0,
      searchPreferences: {
        minimumAge: min_age,
        maximumAge: max_age,
        genderPreference: 1,
        maximumRangeInKilometers: 1 + dif
      }
    });
  }

  profile = await client.getProfile();
  await save_file("_Profile", profile);
  meta = await client.getMetadata();
  await save_file("_Meta", meta);
  console.log("Update Profile End");

  if (meta.rating.likes_remaining > 0) {
    if (dif >= 100) {
      dif = 0;
      q.push(cb => {
        set_location(client, cb);
      });
    }
    q.push(cb => {
      set_likes(client, cb);
    });
  } else {
    if (dif < 100) {
      dif = 100;
      q.push(cb => {
        set_location(client, cb);
      });
    }
  }
  cb();
}

async function set_next(client, cb) {
  console.log("Send Likes - Next");
  dif++;
  q.push(cb => {
    set_location(client, cb);
  });
  q.push(cb => {
    set_likes(client, cb);
  });
  cb();
}

async function set_likes(client, cb) {
  console.log("Send Likes Start");
  var resp = {};
  resp.likes_remaining = 1;
  while (resp.likes_remaining > 0) {
    const recommendations = await client.getRecommendations();
    if (typeof recommendations == "undefined") {
      q.push(cb => {
        set_next(client, cb);
      });
      cb();
      return;
    }
    if (typeof recommendations.results == "undefined") {
      q.push(cb => {
        set_next(client, cb);
      });
      cb();
      return;
    }
    if (typeof recommendations.results.length == "undefined") {
      q.push(cb => {
        set_next(client, cb);
      });
      cb();
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
        } else {
          save = true;
        }
      } else {
        console.error("Already: ", perso.name);
        q.push(cb => {
          set_next(client, cb);
        });
        q.push(cb => {
          set_likes(client, cb);
        });
      }
    }
  }

  var d = new Date(resp.rate_limited_until) - new Date() + 1000;
  if (d > 0) {
    q.push(cb => {
      set_next(client, cb);
    });

    console.log(
      "Break Until" + new Date(resp.rate_limited_until) + ":" + d + "Sec"
    );
    if (save == true) {
      exec("git add .");
      exec('git commit -m "Tinder Update"');
    }
  } else {
    q.push(cb => {
      set_likes(client, cb);
    });
  }
  data();
  console.log("Send Likes Ende");
  cb();
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
