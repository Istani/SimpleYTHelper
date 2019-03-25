process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version+')';
console.log(software);
console.log("===");
console.log();

// DB Models
const Check = require("./models/game_check.js");
const Game  = require("./models/game.js");
const Links = require("./models/game_link.js");

// Settings
var Discount=75;

async function get_games() {
  var sales = await Links.query().where('discount','>', Discount);
  for (var i = 0; i < sales.length; i++) {
    var sale = sales[i];
    var shops = await Links.query().where('name', sale.name);
    if (shops.length<2) {
      continue;
    }
    var details = await Game.query().where('name', sale.name);

    var text = details[0].description;
    if (text.length>120) {text=text.substring(0,text.indexOf('<br>'));}
    if (text.length>120) {text=text.substring(0,120)+'...';}
    var tmp_obj={};
    tmp_obj.category="Sale "+sale.store;
    tmp_obj.game=sale.name;
    tmp_obj.discount=sale.discount;
    tmp_obj.link=sale.link;
    tmp_obj.display_title=sale.discount+"% auf "+details[0].display_name;
    tmp_obj.display_text=text;

    var active = await Check.query().where('category',tmp_obj.category).where('game',tmp_obj.game);
    if (active.length>0) {
      if (active[0].discount==tmp_obj.discount) {
        await Check.query().patch(tmp_obj).where('category',tmp_obj.category).where('game',tmp_obj.game);
        continue;
      }
      await Check.query().delete().where('category',tmp_obj.category).where('game',tmp_obj.game);
    }
    await Check.query().insert(tmp_obj);
    console.log('New Discount',tmp_obj);
  }
}

get_games();
