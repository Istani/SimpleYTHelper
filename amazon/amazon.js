var config = require('dotenv').config();
var amazon = require('amazon-product-api');

var client = amazon.createClient({
  awsId: process.env.AMAZON_ID,
  awsSecret: process.env.AMAZON_SECRET,
  awsTag: process.env.AMAZON_TAG
});

client.itemSearch({
  keywords: 'Kill Bill',
  responseGroup: 'ItemAttributes,Offers,Images',
  domain: 'webservices.amazon.de'
}, function (err, results, response) {
  if (err) {
    console.error(err[0].Error);
  } else {
    console.log(results);  // products (Array of Object)
    console.log(response); // response (Array where the first element is an Object that contains Request, Item, etc.)
  }
});