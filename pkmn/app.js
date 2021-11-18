process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

const async = require("async");
const fs = require("fs");
const requestp = require("request-promise");
const sleep = require("await-sleep");
const cheerio = require("cheerio");
const cheerioTableparser = require("cheerio-tableparser");
const striptags = require("striptags");

const url = "https://www.bisafans.de/pokedex/listen/numerisch.php";

var pkm_list = [];
const gen = "8";

// ------------------------------ Settings 
var settings = {};
function load_settings() {
  try {
    settings = require("./tmp/settings.json");
    //settings.last_time = new Date(settings.last_time);
  } catch (error) {
    console.error("Settings", "Couldn't load!");
    settings = {};
    settings.last_time = new Date();
    settings.last_time.setDate(settings.last_time.getDate() - 7);
    save_settings();
  }
}
function save_settings() {
  var data = JSON.stringify(settings, null, 2);
  fs.writeFileSync("./tmp/settings.json", data);
  load_settings();
}
load_settings();

function load_pkmn_list() {
  try {
    pkm_list = require("./tmp/pkmn_liste.json");
  } catch (error) {

  }
}
function save_okmn_list() {
  var data = JSON.stringify(pkm_list);
  fs.writeFileSync("./tmp/pkmn_liste.json", data);
  load_pkmn_list();
}
load_pkmn_list();

// ------------------------------ Function 
function replace_all(text) {
  text = replaceType(text);
  text = replaceType(text);
  text = striptags(text);
  text = text.replace("&nbsp;", "");
  text = text.trim();
  return text;
}
function replaceType(text) {
  var new_text = "";
  new_text = text.replace('<a href="https://www.bisafans.de/typendex/', "");
  if (new_text != text) {
    new_text = new_text.replace('.php">', "");
  }
  return new_text;
}

// ------------------------------ Main 
async function main() {
  await requestp({ url: url }, async function(error, response, body) {
    fs.writeFileSync("./tmp/pokemon_liste.html", body);
    $ = cheerio.load(body);
    cheerioTableparser($);
    var tab = $("table").parsetable();
    var dump = [];
    for (var col = 0; col < tab[0].length; col++) {
      for (var row = 0; row < tab.length; row++) {
        if (typeof dump[col] == "undefined") {
          dump[col] = [];
        }
        if (typeof dump[col][row] == "undefined") {
          dump[col][row] = "";
        }
        dump[col][row] = replace_all(tab[row][col]);
      }
    }
    //console.log(dump);
    //return;
    for (var i = 1; i < dump.length; i++) {
      var pkm = { id: dump[i][0], name: dump[i][1], type: dump[i][2] };

      var idx = pkm_list.findIndex(element => element.id == pkm.id);
      if (idx<0) {
        pkm_list.push(pkm);
      }

      await getPkm_Details(pkm.id);
      console.log("Scan: " + pkm.name);
      var idx = pkm_list.findIndex(element => element.id == pkm.id);
      if (typeof pkm_list[idx].attacks == "undefined") {
        pkm_list.splice(idx, 1);
      }
    }

    save_okmn_list();
    fs.unlinkSync("./tmp/pokemon_liste.html");
    console.log("---Done---");
  });
}
async function getPkm_Details(pkm_no) {
  var idx = pkm_list.findIndex(element => element.id == pkm_no);
  await requestp(
    { url: "https://www.bisafans.de/pokedex/" + pkm_no + ".php" },
    async function(error, response, body) {
      fs.writeFileSync("./tmp/pokemon_" + pkm_no + ".html", body);
      $ = cheerio.load(body);
      var moves = $('div[id="movetable-0-gen-' + gen + '"]');
      if (typeof moves.html() == "string") {
        move_obj = cheerio.load(moves.html());
        move_obj("table").each(function(i, table) {
          //console.log(i);
          tab_obj = cheerio.load(table);
          if (i == 0) {
            fs.writeFileSync(
              "./tmp/pokemon_" + pkm_no + "_moves.html",
              tab_obj.html()
            );
          } else if (i == 1) {
            //fs.writeFileSync("./tmp/pokemon_"+pkm_no+"_moves_tm.html", tab_obj.html());
            return;
          } else {
            return;
          }
          cheerioTableparser(tab_obj);
          var tab = tab_obj("table").parsetable();
          var dump = [];
          for (var col = 0; col < tab[0].length; col++) {
            for (var row = 0; row < tab.length - 1; row++) {
              if (typeof dump[col] == "undefined") {
                dump[col] = [];
              }
              if (typeof dump[col][row] == "undefined") {
                dump[col][row] = "";
              }
              dump[col][row] = replace_all(tab[row][col]);
            }
          }
          var attacks = [];
          //console.log(dump);
          for (var i = 1; i < dump.length; i++) {
            var this_atk = {
              level: dump[i][0],
              name: dump[i][1],
              typ: dump[i][2],
              straerke: dump[i][4],
              genauigkeit: dump[i][5]
            };
            if (typeof pkm_list[idx].attacks!="undefined") {
              var attk_idx = pkm_list[idx].attacks.findIndex(element => (element.level == this_atk.level) && (element.name==this_atk.name));
              if (attk_idx>=0) {
                attacks[attk_idx]=this_atk;
              } else {
                attacks.push(this_atk);  
              }
            } else {
              attacks.push(this_atk);
            }
          }
          pkm_list[idx].attacks = attacks;
          fs.unlinkSync("./tmp/pokemon_" + pkm_no + "_moves.html");
        });
      }

      // ToDo: Get Evolve and Gen-Type?
      //process.exit(0);

      fs.unlinkSync("./tmp/pokemon_" + pkm_no + ".html");
    }
  );
}

main();


// ------------------------------ Syth 

async function outgoing(msg_data, content) {
  var tmp_chat = {};
  tmp_chat.service = msg_data.service;
  tmp_chat.server = msg_data.server;
  tmp_chat.room = msg_data.room;
  tmp_chat.content = content;
  console.log(msg_data.server + ": " + content);
  await Outgoing_Message.query().insert(tmp_chat);
  await sleep(1000);
}