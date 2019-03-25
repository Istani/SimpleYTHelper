process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

// Start Includes
var express = require('express');
var exphbs = require('express-handlebars');

// DB Models
const Game = require("./models/game.js");
const News = require("./models/game_check.js");

var All_Games;
var Display_Games;
async function GetAllGames() {
  console.log("Loading Games");
  const g = await Game.query().where({ type: 'game' }).eager("[links, merch]");
  All_Games = g;
  console.log("Total of", All_Games.length, "Games Loaded");
  //require("./img_importer.js");
  Display_Games = [];
  for (var i = 0; i < All_Games.length; i++) {
    if (All_Games[i].links.length > 1) {
      Display_Games.push(All_Games[i]);
    }
  }
  console.log('Display: ', Display_Games.length);
  setTimeout(GetAllGames, 1000 * 60 * 60);
}
GetAllGames();
function FindGame(name, callback) {
  var error = null;
  //console.log("FindGame",All_Games);
  var game = All_Games.find(function (element) {
    return element.name == name;
  });
  if (typeof game == "undefined") {
    error = "Game not found";
  } else {
    game = game.toJSON();
  }
  callback(error, game);
}

// Start Site
var hbs = exphbs.create({
  helpers: {
    /* i18n: function (key, options) {
      var temp_data = {}
      temp_data.data = options;
      var result = i18n.__(key, options);
      result = result.split("[[").join("{{");
      result = result.split("]]").join("}}");
      result = hbs.handlebars.compile(result);
      result = result(temp_data);
      return result;
    }, */
    checkPrice: function (low, high, options) {
      if (low == high) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    },
  },
  defaultLayout: 'main',
  extname: '.hbs'
});

var app = express();
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

//
app.use(express.static('public'));
app.use(function (req, res, next) {
  console.log("REQ:", req.url);
  next();
});

app.get('/impressum', function (req, res) {
  res.render('impressum', { page_title: 'Impressum' });
});

app.get('/news', async function (req, res) {
  var current_news = await News.query().orderBy('created_at','DESC').eager("[details]");
  res.render('news', { page_title: 'News', news: current_news });
});

app.get('/game/:gname', function (req, res) {
  var game_name = req.params.gname;
  FindGame(game_name, function (error, game) {
    game.page_title = game.display_name;
    if (error) {
      console.error(req.url, error);
      res.render('error', { error: error });
    } else {
      res.render('game', game);
    }
  });
});

app.get('/games', function (req, res) {
  res.render('list', { page_title: 'Game List', games: Display_Games });
});

app.get('/', function (req, res) {
  res.redirect("/games");
});


app.listen(3001, () => console.log('Interface on 3001!'));
