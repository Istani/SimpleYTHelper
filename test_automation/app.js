process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

var envpath = __dirname + "/../.env";
console.log("Settingspath:", envpath);
var config = require("dotenv").config({ path: envpath });

const puppeteer = require("puppeteer");
const sleep = require("await-sleep");

console.log();

async function main() {
  var browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false
  });
  var page = await browser.newPage();

  await page.goto("https://www.humblebundle.com/store/search?sort=discount", {
    timeout: 600000
  });
}
main();
