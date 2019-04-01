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
const GameLinks = require('./models/game_link.js');

// Vars
var creds = require('./client_secret.json');
var doc = new GoogleSpreadsheet('1ggXlGu3mntB2WbM1YI6h8YEV7kvZFcQkkKwxcezZmv4');

doc.useServiceAccountAuth(creds, function (err) {
  var date = new Date();
  date.setDate(date.getDate() - 7);

  doc.getRows(1, async function (err, rows) {
    if (err) {
      console.log(err);
      return;
    }

    for (var i = 0; i < rows.length; i++) {
      console.log(rows[i].name);
      rows[i].name_clear = Games.getEncodedName(rows[i].name);
      rows[i].save();

      var store_data = {};
      store_data.store = rows[i].store;
      store_data.link = rows[i].link;
      store_data.name = Games.getEncodedName(rows[i].name_clear);
      store_data.price = parseInt(rows[i].price);
      store_data.discount = parseInt(rows[i].discount);

      var check_store = await GameLinks.query().where('name', store_data.name).where('store', store_data.store);
      if (check_store.length == 0) {
        await GameLinks.query().insert(store_data);
      } else {
        await GameLinks.query().patch(store_data).where('name', store_data.name).where('store', store_data.store);
      }
    }

    setTimeout(() => {
      console.log("===============");
      console.log("Game Import Done");
      process.exit(0);
    }, 60 * 60 * 1000);	

  });

  /*doc.addRow(1, { store: 'Humble', name: 'Game Name (Test)', link: 'http://google.de', price: 100, discount: 0, test: 'JA' }, function(err) {
    if(err) {
      console.log(err);
    }
  });*/

});
