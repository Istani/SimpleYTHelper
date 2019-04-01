process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

const puppeteer = require('puppeteer');
const sleep = require('await-sleep');

const Games = require('./models/game.js');
const GameLinks = require('./models/game_link.js');

var Neustart;
async function main() {
  try {
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

        store_data.store = 'Humble';
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
    Neustart = setTimeout(() => {
      console.log("===============");
      console.log("Game Import Done");
      process.exit(0);
    }, 60 * 1000);	// 1 Minute Warten für Seiten Reload
  }
};

//setTimeout(() => { main(); }, 24 * 60 * 60 * 1000);	// 24*1 Stunde warten bevor Start
main();
