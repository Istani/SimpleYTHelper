process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

const async = require("async");
const fs = require("fs");
const request = require("request-promise");
const sleep = require("await-sleep");
const striptags = require("striptags");

const Steam = require("./models/steam.js");
const Games = require("./models/game.js");
const GameLinks = require("./models/game_link.js");
const GameGenre = require("./models/game_genre.js");

async function main() {
  // get all unknown
  var steam_apps = await Steam.query().where("type", "ERROR");
  console.log(steam_apps.length, "Errored Steam Apps");
  for (var i = 0; i < steam_apps.length; i++) {
    await getAppDetails(steam_apps[i].appid);
  }

  steam_apps = await Steam.query().where("type", "UNKNOWN");
  console.log(steam_apps.length, "Unknown Steam Apps");
  for (var i = 0; i < steam_apps.length; i++) {
    await getAppDetails(steam_apps[i].appid);
  }

  // Set wrong types to ignore
  var tmp_update = 0;
  var steam_types = await Steam.query()
    .select("type")
    .groupBy("type");
  for (var i = 0; i < steam_types.length; i++) {
    console.log("Steam Type:", steam_types[i].type);
    if (steam_types[i].type == "game") {
      continue;
    }
    if (steam_types[i].type == "UNKNOWN") {
      continue;
    }
    if (steam_types[i].type == "ERROR") {
      continue;
    }
    tmp_update += await Steam.query()
      .patch({ ignore: true })
      .where("type", steam_types[i].type);
  }
  if (steam_apps.length <= 100) {
    await getAppOverview();
  } else {
    console.log("Skip Import of new Overview");
  }

  var steam_apps = await Steam.query().where("ignore", false);
  for (var i = 0; i < steam_apps.length; i++) {
    await getAppDetails(steam_apps[i].appid);
  }

  console.log("Game Import Done, Wating 1 Hour for Restart");
  setTimeout(() => {
    process.exit(0);
  }, 60 * 60 * 1000);
}
main();

async function getAppDetails(appid) {
  //console.log('Import App',appid);
  var query_string = { appids: appid, cc: "de", l: "german" };
  var url = Steam.URL_GamesAPI();
  try {
    await request({ url: url, qs: query_string }, async function(
      error,
      response,
      body
    ) {
      if (response.statusCode == 429) {
        // Doesnt Trigger... Need TryCatch arround the Request, for the Programm to continue...
        error = "Too Many Requests";
      }
      if (error) {
        console.error(error);
        await Steam.query()
          .patch({ type: "ERROR" })
          .where("appid", appid)
          .where("type", "UNKNOWN");
        await sleep(1000 * 60 * 5);
      } else {
        try {
          var data = JSON.parse(body);
          fs.writeFileSync("tmp/game.json", JSON.stringify(data, null, 2));

          if (
            typeof data == "undefined" ||
            data == null ||
            typeof data[appid] == "undefined"
          ) {
            console.error(appid, "No Data"); // Do we really need this? Should be error 429...
            await Steam.query()
              .patch({ type: "ERROR" })
              .where("appid", appid)
              .where("type", "UNKNOWN");
            await sleep(1000 * 60 * 5);
          } else if (data[appid].success == false) {
            console.error(appid, "No Success");
            await Steam.query()
              .patch({ type: "FAILED" })
              .where("appid", appid);
            return;
          } else {
            var app_data = data[appid].data;
            await Steam.query()
              .patch({ type: app_data.type })
              .where("appid", appid);

            var overview_data = {
              type: app_data.type,
              banner: app_data.header_image,
              name: Games.getEncodedName(app_data.name),
              display_name: app_data.name,
              description: striptags(app_data.about_the_game, ["br"])
            };

            var store_data = {
              store: "Steam",
              link: "https://store.steampowered.com/app/" + appid,
              name: overview_data.name
            };
            if (typeof app_data.price_overview == "undefined") {
              store_data.price = 0;
              store_data.discount = 0;
            } else {
              store_data.price = app_data.price_overview.final;
              store_data.discount = parseInt(
                app_data.price_overview.discount_percent
              );
            }

            //console.log('Data:',data);
            if (overview_data.type == "game") {
              console.log(appid, "Import");
              if (fs.existsSync("./tmp/game.json") == false) {
                fs.writeFileSync("./tmp/game.json", JSON.stringify(data));
              }

              //console.log('Overview:', overview_data);
              var check_game = await Games.query().where(
                "name",
                overview_data.name
              );
              if (check_game.length == 0) {
                await Games.query().insert(overview_data);
              } else {
                await Games.query()
                  .patch(overview_data)
                  .where("name", overview_data.name);
              }

              //console.log('Store:', store_data);
              var check_store = await GameLinks.query()
                .where("name", store_data.name)
                .where("store", store_data.store);
              if (check_store.length == 0) {
                await GameLinks.query().insert(store_data);
              } else {
                await GameLinks.query()
                  .patch(store_data)
                  .where("name", store_data.name)
                  .where("store", store_data.store);
              }

              // GameGenre
              if (typeof app_data["genres"] != "undefined") {
                for (var i = 0; i < app_data["genres"].length; i++) {
                  var genres = {
                    genre: Games.getEncodedName(
                      app_data["genres"][i]["description"]
                    ),
                    name: overview_data.name
                  };
                  var check_genre = await GameGenre.query()
                    .where("name", genres.name)
                    .where("genre", genres.genre);
                  if (check_genre.length == 0) {
                    await GameGenre.query().insert(genres);
                  } else {
                    await GameGenre.query()
                      .patch(genres)
                      .where("name", genres.name)
                      .where("genre", genres.genre);
                  }
                }
              }
            } else {
              console.log(appid, "No Game");
            }
          }
        } catch (error) {
          console.error(error);
          await Steam.query()
            .patch({ type: "ERROR" })
            .where("appid", appid);
          await sleep(1000 * 60 * 5);
          process.exit(1);
        }
      }
    });
  } catch (error) {
    //console.error(error); // To long Error Message for Status Code 429
    await Steam.query()
      .patch({ type: "ERROR" })
      .where("appid", appid);
    await sleep(1000 * 60 * 5);
  }
}
async function getAppOverview() {
  var url = Steam.URL_Overview();
  console.log("Get Overview", url);

  await request(url, function(error, response, body) {
    if (error) {
      console.error(error);
      return;
    }
    try {
      var data = JSON.parse(body);
      data = data.applist.apps;
      fs.writeFileSync("tmp/overview.json", JSON.stringify(data, null, 2));
      fs.writeFileSync(
        "tmp/overview_org.json",
        JSON.stringify(JSON.parse(body), null, 2)
      );
    } catch (error) {
      console.error(error);
      return;
    }
  });

  try {
    var new_apps = 0;
    var data = require("./tmp/overview.json");
    var base = await Steam.query();
    for (var i = 0; i < data.length; i++) {
      var entry = data[i];
      //console.log(entry);
      var new_entry = { appid: entry.appid, ignore: 0, type: "UNKNOWN" };
      var check = base.find(e => {
        return e.appid == new_entry.appid;
      });
      if (typeof check == "undefined") {
        console.log("Found new SteamApp", new_entry.appid);
        await Steam.query().insert(new_entry);
        new_apps++;
      } else {
        console.log("Already imported SteamApp", new_entry.appid);
        await sleep(1000);
      }
    }
    console.log(new_apps, "new SteamApps found!");
  } catch (error) {
    console.error(error);
  }
}
