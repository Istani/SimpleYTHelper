process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require("dotenv").config({ path: "../.env" });

const async = require("async");
const amazon = require("amazon-product-api");
const Queue = require("better-queue");

const Games = require("./models/game.js");
const GameMerch = require("./models/game_merch.js");

var client = amazon.createClient({
  awsId: process.env.AMAZON_ID,
  awsSecret: process.env.AMAZON_SECRET,
  awsTag: process.env.AMAZON_TAG
});
var q = new Queue(
  function(input, cb) {
    async.series(
      [
        function(callback_intern) {
          input.f(input.d, callback_intern);
        }
      ],
      function(err, data) {
        if (err) {
          console.error(err);
          console.error(err.Error);
        }
        cb();
      }
    );
  },
  { afterProcessDelay: 30000, filo: true }
);
q.on("drain", function() {
  process.exit(0);
});

async function getDetails(name, callback) {
  await client.itemSearch(
    {
      keywords: name,
      responseGroup: "ItemAttributes,Offers,Images",
      domain: "webservices.amazon.de"
    },
    function(err, results, response) {
      var returns = [];
      if (err) {
        // SKIP AMAZON PRASE
      } else {
        for (var i = 0; i < results.length; i++) {
          //console.log(results[i]);  // products (Array of Object)
          //console.log(response); // response (Array where the first element is an Object that contains Request, Item, etc.)
          try {
            var product = {
              store: "amazon",
              product: results[i].ASIN[0],
              name: Games.getEncodedName(name),
              link: results[i].DetailPageURL[0],
              display_name: results[i].ItemAttributes[0].Title[0],
              picture: results[i].MediumImage[0].URL[0],
              price: results[i].OfferSummary[0].LowestNewPrice[0].Amount[0]
            };
            returns.push(product);
            //console.log(product);
          } catch (e) {
            err = e;
          }
        }
      }
      callback(err, returns);
    }
  );
}
async function AddGameMerch(game, callback) {
  try {
    console.log("MERCH", game.display_name);
    async.series(
      [
        function(callback_intern) {
          getDetails(game.display_name, callback_intern);
        }
      ],
      async function(err, data) {
        if (err) {
          // SKIP DATA
        } else {
          // ToDo: why [0] nessesary?
          data = data[0];
          //console.log(data.length);
          //console.log(data);
          for (var i = 0; i < data.length; i++) {
            var check_merch = await GameMerch.query().where({
              store: data[i].store,
              name: data[i].name,
              product: data[i].product
            });
            if (check_merch.length == 0) {
              await GameMerch.query().insert(data[i]);
            } else {
              await GameMerch.query().update(data[i]);
            }
          }
        }
        callback(err, data);
      }
    );
  } catch (error) {
    callback(error);
  }
}

//q.push( () => {getDetails(game,(x) => console.log(x))});
async function main() {
  const AllGames = await Games.query()
    .where({ type: "game" })
    .orderByRaw("RAND()");
  for (var i = 0; i < AllGames.length; i++) {
    q.push({ f: AddGameMerch, d: AllGames[i] });
  }
}

setTimeout(main, 10000);
