process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

// Start Includes
var fs = require('fs');
var express = require('express');
var exphbs = require('express-handlebars');

// DB Models
const Game = require("./models/game.js");
const News = require("./models/game_check.js");
const short_url = require("./models/short_url.js");


var All_Games;
var Display_Games;
async function GetAllGames() {
  console.log("Loading Games");
  const g = await Game.query().where({ type: 'game' }).eager("[links, merch, genre]");
  All_Games = g;
  console.log("Total of", All_Games.length, "Games Loaded");
  require("./img_importer.js");
  Display_Games = [];

  for (var i = 0; i < All_Games.length; i++) {
    if (All_Games[i].links.length > 1) {
      Display_Games.push(All_Games[i]);

      // Adding Ads?
    }
  }
  GetAllCategorys(Display_Games);
  console.log('Display: ', Display_Games.length);
  setTimeout(GetAllGames, 1000 * 60 * 60);
}
GetAllGames();
var All_Categorys;
async function GetAllCategorys(AllGames) {
  All_Categorys = [];
  for (var i = 0; i < AllGames.length; i++) {
    var this_genres = AllGames[i].genre;
    for (var j = 0; j < this_genres.length; j++) {
      var search = All_Categorys.find(e => { e == this_genres[j].genre });
      if (typeof search == "undefined") {
        this_genres[this_genres.length] = this_genres[j].genre;
      }
    }
  }
  console.log(All_Categorys);
}
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
function FindCategory(name, callback) {
  var error = null;
  //console.log("FindGame",All_Games);
  var game = All_Games.filter(function (element) {
    var return_value = false;
    for (var i = 0; i < element.genre.length; i++) {
      if (element.genre[i].genre == name) {
        return_value = true;
      }
    }
    return return_value;
  });
  if (typeof game == "undefined") {
    error = "Category not found";
  }/* else {
    game = game.toJSON();
  }*/
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
//var swStats = require('swagger-stats');
//var apiSpec = require('swagger.json');
//app.use(swStats.getMiddleware(/*{ swaggerSpec: apiSpec }*/));

//
app.use(express.static('public'));
app.use(function (req, res, next) {
  if (fs.existsSync('./tmp/req.json') == false) {
    //fs.writeFileSync("./tmp/req.json", JSON.stringify(req));
  }
  if (fs.existsSync('./tmp/res.json') == false) {
    //fs.writeFileSync("./tmp/res.json", JSON.stringify(res));
  }
  console.log("REQ:", req.url);
  next();
});

app.get("/s/:code", short_url.express);

app.get('/impressum', function (req, res) {
  res.render('impressum', { page_title: 'Impressum' });
});

app.get('/news', async function (req, res) {
  var current_news = await News.query().orderBy('created_at', 'DESC').orderBy('game').eager("[details]");
  res.render('news', { page_title: 'News', news: current_news });
});

app.get('/game/:gname', function (req, res) {
  var game_name = req.params.gname;
  FindGame(game_name, function (error, game) {
    if (error) {
      console.error(req.url, error);
      res.render('error', { error: error });
    } else {
      if (game == undefined) {
        console.error(req.url, 'Game Undefined?');
        res.render('error', { error: 'Game Undefined?' });
      } else {
        game.page_title = game.display_name;
        res.render('game', game);
      }
    }
  });
});

app.get('/category/:cname', function (req, res) {
  var category_name = req.params.cname;
  FindCategory(category_name, function (error, cat_games) {
    if (error) {
      console.error(req.url, error);
      res.render('error', { error: error });
    } else {
      if (cat_games == undefined) {
        console.error(req.url, 'Category Undefined?');
        res.render('error', { error: 'Category Undefined?' });
      } else {
        res.render('list', { page_title: category_name + ' List', games: cat_games });
      }
    }
  });
});


app.get('/games', function (req, res) {
  res.render('list', { page_title: 'Game List', games: Display_Games });
});

app.get('/', function (req, res) {
  res.redirect("/news");
});


app.listen(3001, () => console.log('Interface on 3001!'));
