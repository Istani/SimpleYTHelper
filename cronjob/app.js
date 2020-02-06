process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

const moment = require("moment");
//const config = require('dotenv').config();
const config = require("dotenv").config({ path: "../.env" });
const exec = require("child_process").execSync;
const fs = require("fs");
const async = require("async");

const cron = require("node-cron");

cron.schedule("30 11 * * *", () => {
  console.log("Backup Everday at 11:30!");
  var cmd = "";

  var timedate = moment().format("YYYYMMDD_HHmmss");

  cmd =
    process.env.PATH_MYSQLDUMP +
    " --user " +
    process.env.DB_USER +
    " --password=" +
    process.env.DB_PASS +
    " " +
    process.env.DB_NAME +
    " >> backup\\" +
    timedate +
    "_" +
    process.env.DB_NAME +
    ".sql";
  cmd = cmd.split("\\").join("/");
  //console.log(cmd);
  console.log("Create Dump!");
  exec(cmd);

  console.log("Copy Apache!");
  cmd =
    "cp /etc/apache2/sites-available/games-on-sale.conf  " +
    __dirname +
    "\\backup\\";
  cmd = cmd.split("\\").join("/");
  exec(cmd);

  console.log("Create Archive!");
  var TAR_COMMAND = process.env.PATH_TAR;
  var ARCIVE_PATH =
    "backup\\" + timedate + "_" + process.env.DB_NAME + ".tar.gz";
  cmd =
    "" +
    TAR_COMMAND +
    " " +
    ARCIVE_PATH +
    " " +
    "backup\\" +
    timedate +
    "_" +
    process.env.DB_NAME +
    ".sql ..\\logs\\*";
  cmd = cmd.split("\\").join("/");
  exec(cmd);

  console.log("Delete Dump!");
  cmd = "rm " + __dirname + "\\backup\\*.sql";
  cmd = cmd.split("\\").join("/");
  exec(cmd);

  console.log("Turncate Logs!");
  cmd = "truncate ..\\logs\\* --size 0";
  cmd = cmd.split("\\").join("/");
  exec(cmd);

  console.log("Delete Old Backups!");
  exec("rm " + "backup/*.sql");
  async.series(
    [
      function(callback) {
        fs.readdir("backup", (err, files) => {
          files.forEach(file => {
            var FileStats = fs.statSync("backup/" + file);
            var FileBirth = moment(FileStats.birthtime);
            var ItsOld = moment() - FileBirth;
            var ItsOld_Calc = ItsOld / 1000; // In Sec
            ItsOld_Calc = ItsOld_Calc / 60; // In Min
            ItsOld_Calc = ItsOld_Calc / 60; // In Std
            ItsOld_Calc = ItsOld_Calc / 24; // In Tag
            ItsOld_Calc = ItsOld_Calc / 7; // In Weeks

            if (ItsOld_Calc >= 1) {
              console.log("Delete " + file);
              exec("rm " + "backup/" + file);
            }
          });
          callback();
        });
      }
    ],
    function(error) {
      console.log("===DONE===");
      //process.exit(1);
    }
  );
});
cron.schedule("00 */1 * * * ", () => {
  console.log("Update Every Hour");
  exec("sh ~/SimpleYTHelper/update.sh");
});

console.log("Cronjobs Running");
