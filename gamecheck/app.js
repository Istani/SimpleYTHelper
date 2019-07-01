process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version + ')';
console.log(software);
console.log("===");
console.log();

// DB Models
const Check = require("./models/game_check.js");
const Game = require("./models/game.js");
const Links = require("./models/game_link.js");
const Merch = require("./models/game_merch.js");
const Tweets = require("./models/send_tweets.js");

// Settings
var Discount = 75;
var Max_Text = 150;

const sleep = require('await-sleep');

async function get_games() {
  var sales = await Links.query().where('discount', '>', Discount).orderBy('name');

  for (var i = 0; i < sales.length; i++) {
    var sale = sales[i];
    var shops = await Links.query().where('name', sale.name);
    if (shops.length < 2) {
      continue;
    }
    var details = await Game.query().where('name', sale.name);

    if (details.length == 0) {
      continue;
    }

    var text = details[0].description;
    text = text.replace(/<br \/>/g, '<br>');
    if (text.length > Max_Text) { text = text.substring(0, text.indexOf('<br>')); }
    if (text.length < Max_Text) {
      text = details[0].description.replace('<br>', '');
      if (text.length > Max_Text) { text = text.substring(0, text.indexOf('<br>')); }
    }
    if (text.length < Max_Text) {
      text = details[0].description.replace('<br>', '');
      text = text.replace('<br>', '');
      if (text.length > Max_Text) { text = text.substring(0, text.indexOf('<br>')); }
    }
    if (text.length < Max_Text) {
      text = details[0].description;
      text = text.replace(/<br>/g, '\n');
    }
    if (text.length > Max_Text) { text = text.substring(0, Max_Text) + '...'; }

    var tmp_obj = {};
    tmp_obj.category = "Sale " + sale.store;
    tmp_obj.game = sale.name;
    tmp_obj.discount = sale.discount;
    tmp_obj.link = sale.link;
    tmp_obj.display_title = details[0].display_name + " > " + sale.discount + "% (" + sale.formatPrice + "€)";
    tmp_obj.display_text = text;

    var active = await Check.query().where('category', tmp_obj.category).where('game', tmp_obj.game);
    if (active.length > 0) {
      if (active[0].discount == tmp_obj.discount) {
        tmp_obj.created_at = active[0].created_at;
        await Check.query().patch(tmp_obj).where('category', tmp_obj.category).where('game', tmp_obj.game);
        await sleep(1000);
        continue;
      }
      await Check.query().delete().where('category', tmp_obj.category).where('game', tmp_obj.game);
    }
    await Check.query().insert(tmp_obj);

    var tmp_tweet={};
    tmp_tweet.user="GamesOnSaleDE";
    tmp_tweet.message = "" + tmp_obj.display_title + " " + tmp_obj.link;
    await Tweets.query().insert(tmp_tweet);

    // Adding Discord
    console.log('New Discount', JSON.stringify(tmp_obj));
    await sleep(1000);
  }

  console.log("Delete all older as " + Check.DeleteDate);

  await Check.query().delete().where('updated_at', '<', Check.DeleteDate);
  await Merch.query().delete().where('updated_at', '<', Check.DeleteDate);
  await Links.query().delete().where('updated_at', '<', Check.DeleteDate);
  await Game.query().delete().where('updated_at', '<', Check.DeleteDate);

  setTimeout(get_games, 1000 * 60 * 15); // 15 Minuten
}

get_games();

async function get_link(link) {
  
}
get_link('');
