const striptags = require('striptags');
const game_db = require('./models/games.js');

const puppeteer = require('puppeteer');

(async function main() {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.humblebundle.com/store/search?sort=discount', {
      timeout: 6000000
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
        var eprice = await entity.$eval('.price', div => div.innerHTML);

        ediscount = ediscount.replace("-", "");
        ediscount = ediscount.replace("%", "");

        eprice = eprice.replace('€', '');
        eprice = eprice.replace(',', '');

        console.log(ename, elink, ediscount, eprice);

        var store_data = {};
        store_data.store = 'Humble';
        store_data.link = elink;
        store_data.name = game_db.get_name(ename);
        store_data.price = parseInt(eprice);
        store_data.discount = parseInt(ediscount);

        game_db.import_store_links(null, (err) => { if (err) { console.error("Game Import", err); } }, store_data);
        //process.exit(0);
      }
      if (entitys.length < 20) {
        next_page = false;
      }
      var next = await page.$('.grid-next');
      next.click();
      await page.waitForNavigation();
    }

    console.log("===============");
    console.log("Game Import Done, Wating 1 Hour for Restart");
    setTimeout(() => { process.exit(0) }, 60 * 60 * 1000);	// 1 Stunde warten bevor Ende und Neustart

  } catch (e) {
    console.error("ERROR", e);
  }
})();