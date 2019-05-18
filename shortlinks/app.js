process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

// Start Includes
const express = require("express");
const short_url = require("./models/short_url.js");


var app = express();

app.get("/:code", short_url.express);

app.listen(3002, () => {
 console.log(`Shorter started!`);
});

async function test_link() {
  var test = await short_url.gen_link("http://google.de");
  console.log(test);
}
test_link();
