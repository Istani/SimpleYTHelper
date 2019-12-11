process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");

var envpath = __dirname + "/../.env";
console.log("Settingspath:", envpath);
var config = require("dotenv").config({ path: envpath });

var exec = require("child_process").execSync;
var queue = require("better-queue");
var cron = require("node-cron");
var BumAPI = require("bumbleapi")(
  process.env.BUMBLE_LOGIN,
  process.env.BUMBLE_PASS
);

var q = new queue(
  function(input, cb) {
    input(cb);
  },
  { afterProcessDelay: 1000 * 60 }
);
cron.schedule("00 01 * * *", () => {
  exec("git add .");
  exec('git commit -m "Bumble Update"');
  process.exit(0);
});

var count = 100;
q.push(cb => {
  Login(cb);
});

async function Login(cb) {
  BumAPI.startup().then(res => {
    console.log(res);
    try {
      exec("rm tmp/P_*");
    } catch (e) {}
    q.push(cb => {
      GetUser(cb);
    });
    cb();
  });
}
async function GetUser(cb) {
  try {
    BumAPI.getEncounters().then(data => {
      for (let i = 0; i < data.results.length; i++) {
        if (count > 0) {
          count--;
          const element = data.results[i].user;
          console.log(element);
          save_file("P_" + element.user_id, element);
          q.push(cb => {
            Vote(element, cb);
          });
        }
      }

      q.push(cb => {
        GetUser(cb);
      });
      cb();
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
async function Vote(user, cb) {
  try {
    BumAPI.voteYestForEncounter(user.user_id).then(data => {
      console.log(data);
      cb();
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
async function save_file(name, data, only_new = false) {
  try {
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
  } catch (e) {
    console.error(e);
    return false;
  }
}
