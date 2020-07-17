process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

// TODO: Test ToDo Action!
// This is a Test XXX

/* --- */
const fs = require("fs");
const async = require("async");
const sleep = require("await-sleep");
function exec(command) {
  const e = require("child_process").execSync;
  console.log(command);
  try {
    return e(command);
  } catch (e) {
    console.error(e);
    return null;
  }
}

/* Checking Example File for New Data! */
var config = require("dotenv").config({ path: ".env" });
var config_example = "";
if (fs.existsSync(".env")) {
  for (var attributename in config.parsed) {
    config_example += attributename + "=\r\n";
  }
  fs.writeFileSync(".env.example", config_example);
  install();
} else {
  console.error("Update .env File first!");
  process.exit(1);
}

var need_install = 0;
async function install() {
  return;

  //exec("npm install");
  await fs.readdir(__dirname, async function(err, items) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (fs.statSync(__dirname + "/" + item).isDirectory()) {
        if (fs.existsSync(__dirname + "/" + item + "/package.json")) {
          var current_path = __dirname + "/" + item;
          process.chdir(current_path);
          console.log(current_path, "npm install", "ln -s ../models");
          exec("npm install");
          exec("rm -r models");
          exec("ln -s ../models/");
        } else {
          console.log(current_path, "Kein Package.JSON gefunden!");
        }
      }
    }
    process.chdir(__dirname);
    need_install = 0;
    var exec_return = exec("git status -s -uno | wc -l", function(
      error,
      stdout,
      stderr
    ) {
      need_install = stdout;
      console.log("S", stdout);
    });
    need_install = exec_return[0] - 0x30;
    //console.log(need_install);
    //return;

    if (need_install) {
      process.chdir(__dirname + "/.git");
      exec("rm -r hooks");
      exec("ln -s ../hooks");

      process.chdir(__dirname);
      exec("sh hooks/pre-commit");
      //exec("git add .");
      //exec('git commit -am "Post Commit Update"');
      //exec("git push");

      console.log("Restart all");
      exec("pm2 restart all");
      await sleep(10000);
    }
    console.log("Done");
    process.exit(0);
  });
}
