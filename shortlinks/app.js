process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

// Start Includes
const express = require("express");

var app = express();

app.get(":code", async (req, res) => {
  const urlCode = req.params.code;
  return res.redirect(url);
});

app.listen(3002, () => {
 console.log(`Shorter started!`);
});
