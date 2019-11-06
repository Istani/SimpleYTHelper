
process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

const async = require('async');
const fs = require('fs');
const requestp = require('request-promise');
const sleep = require('await-sleep');

const Games = require('./models/game.js');
const GameLinks = require('./models/game_link.js');
const GameGenre = require('./models/game_genre.js');


const url = "https://embed.gog.com/games/ajax/filtered";

var main_page = 2;
var main_max_page = 4;

async function main() {


  for (main_page = 0; main_page < main_max_page; main_page++) {
    await get_page(main_page);
  }

  console.log("Game Import Done, Wating 1 Hour for Restart");
  //await sleep(1000 * 60 * 60);
  process.exit(0);
}
main();

async function get_page(page) {
  var query_string = { mediaType: 'game' };
  if (page > 0) { query_string.page = page; }

  console.log("Searching Page", query_string);

  await requestp({ url: url, qs: query_string }, function (error, response, body) {
    if (error) {
      console.error(error);
      return;
    }
    try {
      var data = JSON.parse(body);
      fs.writeFileSync("./tmp/overview-" + page + ".json", JSON.stringify(data));
    } catch (error) {
      console.error(error);
      return;
    }
  });
  await sleep(1000 * 30); // Weil das Request irgendwie doch nicht richtig ASYNC ist...
  await getGameData(page);
}

async function getGameData(page) {
  var new_apps = 0;
  var n_Data = require('./tmp/overview-' + page + '.json');
  for (var i = 0; i < n_Data.products.length; i++) {
    var entry = n_Data.products[i];
    //console.log(entry);
    var store_data = {
      store: 'GOG',
      link: 'https://embed.gog.com' + entry.url,
      name: Games.getEncodedName(entry.slug),
      price: parseInt(entry.price.finalAmount * 100),
      discount: entry.price.discount
    };

    var check_store = await GameLinks.query().where('name', store_data.name).where('store', store_data.store);
    if (check_store.length == 0) {
      await GameLinks.query().insert(store_data);
    } else {
      await GameLinks.query().patch(store_data).where('name', store_data.name).where('store', store_data.store);
    }
    console.log('Found GOG', JSON.stringify(store_data));
    // GameGenre
    for (var j = 0; j < entry['genres'].length; j++) {
      var genres = {
        genre: Games.getEncodedName(entry['genres'][j]),
        name: store_data.name
      };
      console.log(genres);
      var check_genre = await GameGenre.query().where('name', genres.name).where('genre', genres.genre);
      if (check_genre.length == 0) {
        await GameGenre.query().insert(genres);
      } else {
        await GameGenre.query().patch(genres).where('name', genres.name).where('genre', genres.genre);
      }
    }

    await sleep(1000);

  }
  main_max_page = n_Data.totalPages;
  //await fs.unlinkSync('./tmp/overview-' + page + '.json');
  await sleep(1000);
}