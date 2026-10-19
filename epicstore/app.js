process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

//const puppeteer = require("puppeteer");
const sleep = require("await-sleep");
const fs = require("fs");
const request = require("request");

const Games = require("./models/game.js");
const GameLinks = require("./models/game_link.js");

let STORE_NAME = "Epic";
let sleeptime = 1000;

async function get_Games() {
  const url =
    "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions";
  try {
    const body = await new Promise((resolve, reject) => {
      request.get(
        {
          url,
          qs: { locale: "de", country: "DE", allowCountries: "DE" },
          json: true,
          timeout: 30000
        },
        (error, response, responseBody) => {
          if (error) return reject(error);
          if (!response || response.statusCode !== 200)
            return reject(
              new Error("Epic HTTP " + (response && response.statusCode))
            );
          resolve(responseBody);
        }
      );
    });
    const elements =
      body &&
      body.data &&
      body.data.Catalog &&
      body.data.Catalog.searchStore &&
      body.data.Catalog.searchStore.elements;
    if (!Array.isArray(elements))
      throw new Error("Epic response contains no catalog elements");
    console.log("Epic catalog offers:", elements.length);
    for (const element of elements) {
      if (!element.title || !element.price || !element.price.totalPrice)
        continue;
      const totalPrice = element.price.totalPrice;
      const name = Games.getEncodedName(element.title);
      const game_data = {
        type: "game",
        name,
        display_name: element.title,
        banner: "",
        description: ""
      };
      const existingGame = await Games.query().where("name", name);
      if (existingGame.length === 0) await Games.query().insert(game_data);
      const slug = element.productSlug || element.urlSlug || "";
      const store_data = {
        store: STORE_NAME,
        link: "https://store.epicgames.com/de/p/" + slug,
        name,
        price: parseInt(totalPrice.discountPrice, 10) || 0,
        discount: parseInt(totalPrice.discount, 10) || 0
      };
      const existing = await GameLinks.query()
        .where("name", name)
        .where("store", STORE_NAME);
      if (existing.length === 0) await GameLinks.query().insert(store_data);
      else
        await GameLinks.query()
          .patch(store_data)
          .where("name", name)
          .where("store", STORE_NAME);
    }
  } catch (error) {
    console.error("Epic import failed:", error.message || error);
  }
}
setInterval(get_Games, 4 * 60 * 60 * 1000);

get_Games();
