process.chdir(__dirname);
const packageInfo = require("./package.json");
console.log(packageInfo.name + " (V " + packageInfo.version + ")");
console.log("===\n");

const request = require("request-promise");
const sleep = require("await-sleep");
const striptags = require("striptags");
const Steam = require("./models/steam.js");
const Games = require("./models/game.js");
const GameLinks = require("./models/game_link.js");
const GameGenre = require("./models/game_genre.js");

const DEAL_INTERVAL_MS = 15 * 60 * 1000;
const DISCOVERY_INTERVAL_MS = 24 * 60 * 60 * 1000;
const DETAIL_BATCH_SIZE = 25;
const DETAIL_DELAY_MS = 1100;
const HEALTH_APP_ID = "__steam_import_health__";
const DISCOVERY_APP_ID = "__steam_discovery_health__";

function gameName(name) {
  return Games.getEncodedName(name);
}

async function markHealth() {
  const existing = await Steam.query()
    .where("appid", HEALTH_APP_ID)
    .first();
  if (existing)
    await Steam.query()
      .patch({ type: "HEALTH", ignore: true })
      .where("appid", HEALTH_APP_ID);
  else
    await Steam.query().insert({
      appid: HEALTH_APP_ID,
      type: "HEALTH",
      ignore: true
    });
}

async function upsertGame(game) {
  const existing = await Games.query().findById(game.name);
  if (!existing) await Games.query().insert(game);
}

async function upsertLink(link) {
  const existing = await GameLinks.query()
    .where("name", link.name)
    .where("store", "Steam");
  if (existing.length === 0) await GameLinks.query().insert(link);
  else
    await GameLinks.query()
      .patch(link)
      .where("name", link.name)
      .where("store", "Steam");
}

async function importFeaturedDeals() {
  const url = "https://store.steampowered.com/api/featuredcategories";
  try {
    const data = await request({
      url,
      qs: { cc: "de", l: "german" },
      json: true,
      timeout: 30000
    });
    const categories = ["specials", "top_sellers", "new_releases"];
    const byAppId = new Map();
    for (const category of categories) {
      for (const item of (data[category] && data[category].items) || []) {
        if (item && item.type === 0 && item.id && item.name)
          byAppId.set(item.id, item);
      }
    }
    for (const item of byAppId.values()) {
      const name = gameName(item.name);
      await upsertGame({
        type: "game",
        name,
        display_name: item.name,
        banner: item.header_image || item.large_capsule_image || "",
        description: ""
      });
      await upsertLink({
        store: "Steam",
        name,
        link: "https://store.steampowered.com/app/" + item.id,
        price: parseInt(item.final_price, 10) || 0,
        discount: parseInt(item.discount_percent, 10) || 0
      });
    }
    await markHealth();
    console.log("Steam featured deals imported:", byAppId.size);
  } catch (error) {
    console.error("Steam featured deals failed:", error.message || error);
  }
}

async function importAppDetails(appid) {
  try {
    const data = await request({
      url: Steam.URL_GamesAPI(),
      qs: { appids: appid, cc: "de", l: "german" },
      json: true,
      timeout: 30000
    });
    const response = data && data[appid];
    if (!response || !response.success || !response.data) {
      await Steam.query()
        .patch({ type: "ERROR" })
        .where("appid", appid);
      return;
    }
    const app = response.data;
    if (app.type !== "game") {
      await Steam.query()
        .patch({ type: app.type || "FAILED", ignore: true })
        .where("appid", appid);
      return;
    }
    const name = gameName(app.name);
    await Steam.query()
      .patch({ type: "game", ignore: false })
      .where("appid", appid);
    const overview = {
      type: "game",
      name,
      display_name: app.name,
      banner: app.header_image || "",
      description: striptags(app.about_the_game || "", ["br"])
    };
    const existingGame = await Games.query().findById(name);
    if (existingGame)
      await Games.query()
        .patch(overview)
        .where("name", name);
    else await Games.query().insert(overview);
    const price = app.price_overview || {};
    await upsertLink({
      store: "Steam",
      name,
      link: "https://store.steampowered.com/app/" + appid,
      price: parseInt(price.final, 10) || 0,
      discount: parseInt(price.discount_percent, 10) || 0
    });
    for (const entry of app.genres || []) {
      const genre = { name, genre: gameName(entry.description) };
      const found = await GameGenre.query()
        .where("name", name)
        .where("genre", genre.genre);
      if (found.length === 0) await GameGenre.query().insert(genre);
      else
        await GameGenre.query()
          .patch(genre)
          .where("name", name)
          .where("genre", genre.genre);
    }
  } catch (error) {
    console.error("Steam app " + appid + " failed:", error.message || error);
    await Steam.query()
      .patch({ type: "ERROR" })
      .where("appid", appid);
  }
}

async function enrichDetails() {
  const apps = await Steam.query()
    .where("type", "game")
    .where("ignore", false)
    .orderBy("updated_at", "asc")
    .limit(DETAIL_BATCH_SIZE);
  console.log("Steam detail batch:", apps.length);
  for (const app of apps) {
    await importAppDetails(app.appid);
    await sleep(DETAIL_DELAY_MS);
  }
}

async function discoverAppsIfDue() {
  const health = await Steam.query()
    .where("appid", DISCOVERY_APP_ID)
    .first();
  if (
    health &&
    Date.now() - new Date(health.updated_at).getTime() < DISCOVERY_INTERVAL_MS
  )
    return;
  try {
    const data = await request({
      url: Steam.URL_Overview(),
      json: true,
      timeout: 60000
    });
    const apps = (data.applist && data.applist.apps) || [];
    const known = new Set(
      (await Steam.query().select("appid")).map(entry => String(entry.appid))
    );
    const newApps = apps
      .filter(entry => entry && entry.appid && !known.has(String(entry.appid)))
      .map(entry => ({ appid: entry.appid, ignore: false, type: "UNKNOWN" }));
    for (let index = 0; index < newApps.length; index += 1000)
      await Steam.query().insert(newApps.slice(index, index + 1000));
    if (health)
      await Steam.query()
        .patch({ type: "HEALTH", ignore: true })
        .where("appid", DISCOVERY_APP_ID);
    else
      await Steam.query().insert({
        appid: DISCOVERY_APP_ID,
        type: "HEALTH",
        ignore: true
      });
    console.log("Steam app discovery added:", newApps.length);
  } catch (error) {
    console.error("Steam discovery failed:", error.message || error);
  }
}

let running = false;
async function run() {
  if (running) return;
  running = true;
  try {
    await importFeaturedDeals();
    await enrichDetails();
    await discoverAppsIfDue();
  } catch (error) {
    console.error("Steam import run failed:", error.stack || error);
  } finally {
    running = false;
  }
}

run();
setInterval(run, DEAL_INTERVAL_MS);
