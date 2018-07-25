const request = require("request");
const queue_lib = require('better-queue');
const striptags = require('striptags');

const game_db = require('./models/games.js');

var overview_url = 'http://api.steampowered.com/ISteamApps/GetAppList/v0001/';
var games_url = 'http://store.steampowered.com/api/appdetails';

var types = {};

var queue = new queue_lib(
	function (input, cb) {
		input.func(cb);
	}, {}
);

function request_overview() {
	request(overview_url, function (error, response, body) {
		console.log("Importing Gamelist");
		if (error) {
			console.error("Overview", error);
			process.exit(1);
		}
		try {
			var data = JSON.parse(body);
			data = data.applist.apps.app;
			data.forEach(function (game) {
				queue.push({ id: game.appid, func: (callback) => { request_game(game.appid, game.name, callback); } });
			});
		} catch (err) {
			console.error("Parse", err);
		}
	});
}

function request_game(appid, name, callback) {
	console.log("Game Import", appid, "-", name);
	var query_string = {
		appids: appid,
		cc: 'de',
		l: 'german'
	};
	request({
		url: games_url,
		qs: query_string
	}, function (err, response, body) {
		if (err) {
			console.error("Get Game Details", err);
			callback();
			return;
		}
		var data = JSON.parse(body);
		if ((typeof data == "undefined") || (data == null) || (typeof data[appid] == "undefined")) {
			console.error("STEAM", appid, "No Data? Rate Limit?");
			if (typeof types["No Data"] == "undefined") {
				types["No Data"] = 1;
			} else {
				types["No Data"]++;
			}
			//queue.push({ id: appid, func: (callback) => { request_game(appid, name, callback); } });
		} else {
			if (data[appid].success) {
				var game_data = data[appid].data;
				if (typeof types[game_data.type] == "undefined") {
					types[game_data.type] = 1;
				} else {
					types[game_data.type]++;
				}
				var store_data = {};
				var overview_data = {};
				overview_data.type = game_data.type;
				overview_data.name = game_db.get_name(game_data.name);
				//overview_data.dlcs = game_data.dlc; // TODO - Name ID Convention
				overview_data.description = striptags(game_data.about_the_game, ['br']);//game_data.short_description;
				overview_data.banner = game_data.header_image;

				store_data.store = 'Steam';
				store_data.link = '';
				store_data.name = game_db.get_name(game_data.name);
				store_data.price = game_data.price_overview.final / 100;
				store_data.discount = game_data.price_overview.discount_percent;

				console.log("overview_data", overview_data);
				console.log("store_data", store_data);

				//console.log("orginal_data", game_data);

			} else {
				console.error("STEAM", "No Success for", appid);
				if (typeof types["No Success"] == "undefined") {
					types["No Success"] = 1;
				} else {
					types["No Success"]++;
				}
			}
		}
		callback();
	});
}
//request_game(57690, "", () => { });
//request_overview();

game_db.get_name("Witcher 3: Wildhunt");
game_db.get_name("Wie macht man ein R $%");

queue.on('drain', function () {
	console.log("===============");
	console.log(types);
	console.log("===============");

	console.log("Game Import Done, Wating 1 Hour for Restart");
	setTimeout(() => { process.exit(0) }, 60 * 60 * 1000);	// 1 Stunde warten bevor Ende und Neustart
})