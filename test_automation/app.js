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
var FL = process.env.FACEBOOK_LOGIN;
var FP = process.env.FACEBOOK_PASS;

(async function main() {
  var browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false
  });
  var page = await browser.newPage();

  await page.goto("https://facebook.com", {
    timeout: 600000
  });

  await page.$eval("input[name=email]", el => (el.value = FL));
  await page.$eval("input[name=pass]", el => (el.value = FP));
  await page.$eval("input[value=Anmelden]", el => el.click());
  await page.waitForNavigation();
})();
