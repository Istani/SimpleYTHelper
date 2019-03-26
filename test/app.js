process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

// Modules
const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');

// Database
const Games = require('./models/game.js');
//const GameLinks = require('./models/game_link.js');

// Vars
var creds = require('./client_secret.json');
var doc = new GoogleSpreadsheet('1ggXlGu3mntB2WbM1YI6h8YEV7kvZFcQkkKwxcezZmv4');

doc.useServiceAccountAuth(creds, function (err) {

  doc.getRows(1, function (err, rows) {
    if(err) {
      console.log(err);
      return;
    }

    console.log(rows[0]);

  });

  /*doc.addRow(1, { store: 'Humble', name: 'Game Name (Test)', link: 'http://google.de', price: 100, discount: 0, test: 'JA' }, function(err) {
    if(err) {
      console.log(err);
    }
  });*/

});