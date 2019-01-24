process.chdir(__dirname);
const package_info = require('./package.json');
var software=package_info.name+" (V "+package_info.version+")";
console.log(software);
console.log("===");
console.log();
const config = require('dotenv').config({path: '../.env'});

const amazon = require('amazon-product-api');
const Queue = require('better-queue');

const Games = require('./models/game.js');
const GameMerch = require('./models/game_merch.js');

var client = amazon.createClient({
  awsId: process.env.AMAZON_ID,
  awsSecret: process.env.AMAZON_SECRET,
  awsTag: process.env.AMAZON_TAG
});
var q = new Queue(function (input) {
  input();
});
q.on('drain', function (){
 process.exit(0);
});

var game='Kill Bill';
async function getDetails(name, callback) {
  await client.itemSearch({
    keywords: name,
    responseGroup: 'ItemAttributes,Offers,Images',
    domain: 'webservices.amazon.de'
  }, function (err, results, response) {
    var returns = [];
    if (err) {
      console.error(err[0].Error);
    } else {
      for (var i = 0;i<results.length;i++) {
        //console.log(results[i]);  // products (Array of Object)
        //console.log(response); // response (Array where the first element is an Object that contains Request, Item, etc.)
        var product = {
          store: 'amazon',
          product: results[i].ASIN[0],
          name: name,
          link: results[i].DetailPageURL[0],
          display_name:results[i].ItemAttributes[0].Title[0],
          picture: results[i].MediumImage[0].URL[0],
          price: results[i].OfferSummary[0].LowestNewPrice[0].Amount[0]
        };
        returns.push(product);
        //console.log(product);
      }
    }
    callback(returns);
  });
}

q.push( () => {getDetails(game,(x) => console.log(x))});
