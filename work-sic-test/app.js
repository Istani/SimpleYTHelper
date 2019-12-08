process.chdir(__dirname);
var path_target = __dirname;
var fs = require("fs");
var queue = require("better-queue");
var async = require("async");
var exec = require("child_process").execSync;

var q = new queue(function(input, cb) {
  input(cb);
});

var matchup = {};
var authors = {};
try {
  authors = require("./tmp/authors.json");
} catch (e) {}

function checkFolder(path, email, cb) {
  var files = fs.readdirSync(path);
  for (let i = 0; i < files.length; i++) {
    if (fs.lstatSync(path + files[i]).isDirectory() == true) {
      if (files[i] == ".git") {
        q.push(cb => {
          doGitLog(path, email, cb);
        });
      } else {
        q.push(cb => {
          checkFolder(path + files[i] + "\\", email, cb);
        });
      }
    }
  }
  cb();
}

function doGitLog(path, email, cb) {
  console.log(path);
  var folders = path.split("\\");
  var project = folders[folders.length - 2];
  var output = path_target + "\\tmp\\" + project + ".txt";
  process.chdir(path);
  exec('git config user.name "Sascha Kaufmann"');
  exec('git config user.email "' + email + '"');
  try {
    exec("git pull");
  } catch (e) {}
  exec('git log --format="%at %ae %f" > ' + output);
  process.chdir(__dirname);
  checkGitLog(output, project);
  cb();
}

function checkGitLog(log, project) {
  var file = fs.readFileSync(log);
  file = file.toString();
  var lines = file.split("\n");
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    var fields = line.split(" ");
    var dat = parseInt(fields[0] / 60 / 60 / 24);
    var author = fields[1];
    var timeOld = parseInt(Date.now() / 1000 / 60 / 60 / 24 - 180);
    if (timeOld > dat) {
      continue;
    }
    if (typeof authors[author] == "undefined") {
      authors[author] = author;
      fs.writeFileSync("./tmp/authors.json", JSON.stringify(authors, null, 2));
    }
    author = authors[author];
    if (typeof matchup[dat] == "undefined") {
      matchup[dat] = {};
    }
    if (typeof matchup[dat][author] == "undefined") {
      matchup[dat][author] = {};
    }
    if (typeof matchup[dat][author][project] == "undefined") {
      matchup[dat][author][project] = 0;
    }
    matchup[dat][author][project]++;
  }
  fs.writeFileSync("./tmp/matchup.json", JSON.stringify(matchup, null, 2));
  fs.unlinkSync(log);
}

function backupVentronic(path, file_backup, cb) {
  var datum = new Date()
    .toISOString()
    .replace("-", "")
    .replace("-", "")
    .substr(0, 8);
  exec("del C:\\temp /Q /S /F");
  exec("RD C:\\temp /Q /S");
  exec("mkdir C:\\temp");

  var files = fs.readdirSync(path);
  for (let i = 0; i < files.length; i++) {
    if (fs.lstatSync(path + files[i]).isDirectory() == true) {
      process.chdir(path + files[i]);

      try {
        exec("git pull --all");
      } catch (e) {}

      need_backup =
        exec("git status -s -uno | wc -l", function(error, stdout, stderr) {
          need_install = stdout;
        })[0] - 0x30;

      if (need_backup) {
        exec("git submodule foreach 'git checkout master'");
        exec("git submodule foreach 'git add .'");
        exec("git submodule foreach 'git commit -am \"UNSYNCT UPDATE\"'");
        exec("git submodule foreach 'git pull --all'");
        exec("git submodule foreach 'git push --all'");

        exec("git add .");
        exec('git commit -am "UNSYNCT UPDATE"');
      }
      try {
        exec("git push origin --all --recurse-submodules=on-demand");
      } catch (e) {}

      if (file_backup) {
        exec("mkdir C:\\temp\\" + files[i]);
        exec(
          'c:\\programme\\7-zip\\7z.exe a -r "C:\\temp\\' +
            files[i] +
            "\\" +
            datum +
            "_" +
            files[i] +
            '.zip" "' +
            path +
            files[i] +
            '"'
        );
      }
    }
  }
  process.chdir(__dirname);
  cb();
}

function checkMatchup(email, cb) {
  var loadMatchup = require("./tmp/matchup.json");
  var all_log = [];
  var datum = parseInt(Date.now() / 1000 / 60 / 60 / 24); // HEUTE
  var datum_old = datum - 180;
  while (datum_old <= datum) {
    var day_log = {};
    var workday = true;
    if (typeof loadMatchup[datum_old] == "undefined") {
      workday = false;
    } else if (typeof loadMatchup[datum_old][email] == "undefined") {
      workday = false;
    }
    day_log.date = new Date(datum_old * 24 * 60 * 60 * 1000);
    day_log.project = {};
    if (workday) {
      day_log.project = loadMatchup[datum_old][email];
    }
    all_log.push(JSON.stringify(day_log));
    datum_old++;
  }
  fs.writeFileSync("./tmp/work.json", JSON.stringify(all_log, null, 2));
  cb();
}

//q.push(cb => {backupVentronic("C:\\PRO\\HOEFER\\Cpu_200\\", true, cb);});
//q.push(cb => {checkFolder("C:\\PRO\\HOEFER\\", "skaufmann@ventronic.com", cb);});
//q.push(cb => {checkFolder("Y:\\SimpleSoftwareStudioShare\\","sascha.u.kaufmann@googlemail.com",cb);});
//q.push(cb => {checkFolder("C:\\ZoD\\","sascha.u.kaufmann@googlemail.com",cb);});
q.push(cb => {
  checkMatchup("skaufmann@ventronic.com", cb);
});

exec('git config --global user.name "Sascha Kaufmann"');
exec('git config --global user.email "sascha.u.kaufmann@googlemail.com"');
