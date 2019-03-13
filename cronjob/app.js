const moment = require("moment");
const config = require('dotenv').config();
const exec = require('child_process').execSync;
const fs = require('fs');
const async = require('async');

const cron = require('node-cron');

// Nowaday: For Windows
cron.schedule('30 11 * * *', () => {
  var cmd = "";

  var timedate = moment().format("YYYYMMDD_HHmmss");

  cmd = process.env.PATH_MYSQLDUMP + ' --user ' + process.env.DB_USER + ' --password=' + process.env.DB_PASS + ' ' + process.env.DB_NAME + ' >> cronjob\\backup\\' + timedate + '_' + process.env.DB_NAME + '.sql';
  //console.log(cmd);
  console.log("Create Dump!");
  exec(cmd);

  console.log("Create Archive!");
  var TAR_COMMAND = process.env.PATH_TAR;
  var ARCIVE_PATH = __dirname + "\\backup\\" + timedate + '_' + process.env.DB_NAME + ".tar";
  cmd = '' + TAR_COMMAND + ' -r ' + ARCIVE_PATH + " " + __dirname + "\\backup\\" + timedate + '_' + process.env.DB_NAME + ".sql";
  cmd = cmd.split("\\").join("/");
  exec(cmd);

  console.log("Delete Dump!");
  cmd = "del " + __dirname + "\\backup\\*.sql";
  exec(cmd);



  console.log("Delete Old Backups!");
  async.series(
    [
      function (callback) {
        fs.readdir(__dirname + '\\backup', (err, files) => {
          files.forEach(file => {
            var FileStats = fs.statSync(__dirname + '\\backup\\' + file);
            var FileBirth = moment(FileStats.birthtime);
            var ItsOld = moment() - FileBirth;
            var ItsOld_Calc=ItsOld/1000;	// In Sec
            ItsOld_Calc=ItsOld_Calc/60;		// In Min
            ItsOld_Calc=ItsOld_Calc/60;		// In Std
            ItsOld_Calc=ItsOld_Calc/24;		// In Tag
            ItsOld_Calc=ItsOld_Calc/7;		// In Weeks
      
            if (ItsOld_Calc >= 1) {
              console.log("Delete " + file);
              exec("del " + __dirname + '\\backup\\' + file);
            }
          });
          callback();
        })  
      }
    ], function (error) {
      console.log("===DONE===");
      process.exit(0);
    }
  )
});
console.log("Conrjob Everday at 11:30!");
