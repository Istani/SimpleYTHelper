const moment = require("moment");
const config = require('dotenv').config();
const exec = require('child_process').execSync;
const fs = require('fs');

const cron = require('node-cron');

cron.schedule('00 11 * * *', () => {
  var cmd = "";

  try {
    cmd = "mkdir -p cronjob/backup";
    //console.log(cmd);
    exec(cmd);
  } catch (e) {
    //console.log(e);
  }

  var timedate = moment().format("YYYYMMDD_HHmmss");

  cmd = process.env.PATH_MYSQLDUMP + ' --user ' + process.env.DB_USER + ' --password=' + process.env.DB_PASS + ' ' + process.env.DB_NAME + ' >> cronjob\\backup\\' + timedate + '.sql';
  //console.log(cmd);
  console.log("Create Dump!");
  exec(cmd);

  console.log("Create Archive!");
  var TAR_COMMAND = process.env.PATH_TAR;
  var ARCIVE_PATH = __dirname + "\\backup\\" + timedate + ".tar";
  cmd = '' + TAR_COMMAND + ' -r ' + ARCIVE_PATH + " " + __dirname + "\\backup\\" + timedate + ".sql";
  cmd = cmd.split("\\").join("/");
  exec(cmd);

  console.log("Delete Dump!");
  cmd = "del " + __dirname + "\\backup\\*.sql";
  exec(cmd);



  console.log("Delete Old Backups!");
  fs.readdir(__dirname + '\\backup', (err, files) => {
    files.forEach(file => {
      var FileStats = fs.statSync(__dirname + '\\backup\\' + file);
      var FileBirth = moment(FileStats.birthtime);
      var ItsOld = moment() - FileBirth;

      if ((ItsOld / 1000 / 60 / 60 / 24 / 7 >= 1)) {
        console.log("Delete " + file);
        exec("del " + __dirname + '\\backup\\' + file);
      }
    });
  })
  console.log("===DONE===");
  process.exit(0);
});
console.log("Conrjob Everday at 11:00!");