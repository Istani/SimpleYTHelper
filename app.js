process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version+')';
console.log(software);
console.log("===");
console.log();

/* --- */
const fs = require('fs');
const async = require('async');
const exec = require('child_process').execSync;

/* Checking Example File for New Data! */
var config = require('dotenv').config({path: '.env'});
var config_example = "";
if (fs.existsSync(".env")) {
  for (var attributename in config.parsed) {
    config_example += attributename + "=\r\n";
  }
  fs.writeFileSync('.env.example', config_example);
  install();
} else {
  console.error("Update .env File first!");
  process.exit(1);
}

var need_install=false;
async function install() {
  fs. readdir(__dirname, function(err, items) {
    for (var i = 0; i<items.length;i++) {
      var item = items[i];
        if (fs.statSync(__dirname +'/' +item).isDirectory()) {
          if (fs.existsSync(__dirname+'/'+item+'/package.json')) {
          var tmp_pck = require(__dirname+'/'+item+'/package.json');
          async.series([
            (cb) => {check_modules(tmp_pck,cb);}
          ], () => {});
        }
      }
    }
    if (need_install) {
     exec('git add package.json');
     exec('git add package-lock.json');
     exec('git add .env.example');
     exec('git commit -am "Package Update"');
     exec('git push');

     exec('pm2 restart all');
    }
    process.exit(0);
  });
}

async function check_modules(package,cb) {
  var debs = Object.keys(package.dependencies);
  for (var i = 0; i<debs.length;i++) {
    try {
      var tmp_mods = require(debs[i]);
    } catch (e) {
      console.error(debs[i]+': '+e.code);
      need_install=true;
      exec('npm install --save '+debs[i]);
    }
  }
  cb();
}
