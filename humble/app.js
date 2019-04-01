process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

const puppeteer = require('puppeteer');
const sleep = require('await-sleep');
const fs = require('fs');

const Games = require('../models/game.js');
const GameLinks = require('../models/game_link.js');

var Neustart;
let STORE_NAME = "Humble";

async function main() {
  try {
    import_data();
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.humblebundle.com/store/search?sort=discount', {
      timeout: 600000
    });

    var next_page = true;

    while (next_page) {
      await page.waitForSelector('.entity');
      var entitys = await page.$$('.entity');
      for (const entity of entitys) {
        var ename = await entity.$eval('.entity-title', elemet => elemet.innerHTML);
        var elink = await entity.$eval('.entity-link', link => link.href);
        try {
          var ediscount = await entity.$eval('.discount-percentage', div => div.innerHTML); // TODO: Was wenn kein Discount vorhanden?
        } catch (e) {
          var ediscount = "0";
        }

        try {
          var eprice = await entity.$eval('.price', div => div.innerHTML);
        } catch (e) {
          var eprice = "0";
        }
        ediscount = ediscount.replace("-", "");
        ediscount = ediscount.replace("%", "");

        eprice = eprice.replace('€', '');
        eprice = eprice.replace(',', '');

        console.log(ename, elink, ediscount, eprice);

        var store_data = {};

        store_data.store = STORE_NAME;
        store_data.link = elink + '?partner=istani0815';
        store_data.name = Games.getEncodedName(ename);
        store_data.price = parseInt(eprice);
        store_data.discount = parseInt(ediscount);

        var check_store = await GameLinks.query().where('name', store_data.name).where('store', store_data.store);
        if (check_store.length == 0) {
          await GameLinks.query().insert(store_data);
        } else {
          await GameLinks.query().patch(store_data).where('name', store_data.name).where('store', store_data.store);
        }
      }
      await sleep(5000);
      var next = await page.$('.grid-next');
      next.click();
      await page.waitForNavigation();
    }
  } catch (e) {
    console.error(e);
    Neustart = setTimeout(async () => {
      // Export
      await export_data();
      console.log("===============");
      console.log("Game Import Done");
      process.exit(0);
    }, 60 * 1000);	// 1 Minute Warten für Seiten Reload
  }
};

async function export_data() {
  var Export_Data = await GameLinks.query().where('store', STORE_NAME);
  fs.writeFileSync('tmp/export.json', JSON.stringify(Export_Data), (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
  console.log('The file has been saved!');
}

async function import_data() {
  if (fs.existsSync('tmp/import.json')) {
    try {
      var data = require('./tmp/import.json');
      for (i = 0; i < data.length; i++) {
        var game_data = data[i];
        var check_store = await GameLinks.query().where('name', game_data.name).where('store', game_data.store);
        if (check_store.length == 0) {
          await GameLinks.query().insert(game_data);
        } else {
          await GameLinks.query().patch(game_data).where('name', game_data.name).where('store', game_data.store);
        }
	console.log('Import: ',game_data.name);
	await sleep(1000);
      }
      fs.unlinkSync('tmp/import.json');
      console.log("===============");
      console.log("Game Import Done");
      process.exit(0);
    } catch (e) {
      console.error(e);
    }
  } else {
    console.log('Import-File Not Exists!');
  }
}

setTimeout(() => { main(); }, 12 * 60 * 60 * 1000);	// 12*1 Stunde warten bevor Start
//main();
