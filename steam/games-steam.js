const request = require("request");
const queue_lib = require('better-queue');
const striptags = require('striptags');
const async = require("async");

const game_db = require('./models/games.js');
const steam_controller = require('./models/steam_controller.js');

var Ignore_List = {};
async.parallel([
	function (callback) {
		steam_controller.LIST_IGNORE(Ignore_List, callback, null);
	}
], function (e) {
	if (e) {
		console.error(e);
	}
	if (typeof Ignore_List.apps !== "undefined") {
		var sic = Ignore_List.apps;
		Ignore_List = [];
		sic.forEach(function (game) {
			Ignore_List.push(game.appid);
		});
	} else {
		Ignore_List = [];
	}
	//console.log(Ignore_List.indexOf("" + 10680));
	//process.exit(0);
	imp();
});


var overview_url = 'http://api.steampowered.com/ISteamApps/GetAppList/v0001/';
var games_url = 'http://store.steampowered.com/api/appdetails';

var types = {};

var queue = new queue_lib(
	function (input, cb) {
		input.func(cb);
	}, {

	}
);


function start_import() {
	var Game_List;
	steam_controller.LIST(
		Game_List,
		(data, err) => {
			if (err) { console.error("Controller Import", err); }
			if (data != null) {
				queue.push({ id: "GAME_" + data.appid, func: (callback) => { request_game(data.appid, (err) => { if (err) { console.error("Controller Import", err); } callback(); }); } });
			}
		}
		, null
	);
	Game_List = null;

	//request_overview();
}

function request_overview() {
	console.log("Start Overview Import");
	request(overview_url, function (error, response, body) {
		console.log("Importing Gamelist");
		if (error) {
			console.error("Overview", error);
			process.exit(1);
		}
		try {
			var data = JSON.parse(body);
			data = data.applist.apps.app;
			//console.log("Overview:", Ignore_List.size, data.size);
			data.forEach(function (game) {
				if (Ignore_List.indexOf("" + game.appid) >= 0) {
					// Gibt es schon!	
					console.log("Ignore", game.appid);
				} else {
					queue.push({ id: "CONTROLLER_" + game.appid, func: (callback) => { console.log("Controller Check", game.appid); steam_controller.INSERT_UPDATE(null, (err) => { if (err) { console.error("Controller Import", err); } callback(); }, { appid: game.appid, ignore: 0, type: "UNKNOWN" }); } });
				}
			});
			data = null;

		} catch (err) {
			console.error("Parse", err);
		}
		console.log("Start Game Import");
		start_import();
	});
}

function request_game(appid, callback) {
	console.log("Game Import", appid);
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
		try {
			var data = JSON.parse(body);
			if ((typeof data == "undefined") || (data == null) || (typeof data[appid] == "undefined")) {
				console.error("STEAM", appid, "No Data? Rate Limit?");
				if (typeof types["No Data"] == "undefined") {
					types["No Data"] = 1;
				} else {
					types["No Data"]++;
				}
				setTimeout(() => { request_game(appid, callback); }, 1000 * 60);
				return;
			} else {
				try {
					if (data[appid].success) {
						var game_data = data[appid].data;
						if (typeof types[game_data.type] == "undefined") {
							types[game_data.type] = 1;
						} else {
							types[game_data.type]++;
						}

						var overview_data = {};
						overview_data.type = game_data.type;
						overview_data.name = game_db.get_name(game_data.name);
						overview_data.description = striptags(game_data.about_the_game, ['br']);//game_data.short_description;
						overview_data.banner = game_data.header_image;
						game_db.import_details(null, (err) => { if (err) { console.error("Game Import", err); } }, overview_data);

						var store_data = {};
						store_data.store = 'Steam';
						store_data.link = 'https://store.steampowered.com/app/' + appid;
						store_data.name = game_db.get_name(game_data.name);
						if (typeof game_data.price_overview == "undefined") {
							store_data.price = 0;
							store_data.discount = 0;
						} else {
							store_data.price = game_data.price_overview.final;
							store_data.discount = parseInt(game_data.price_overview.discount_percent);
						}


						game_db.import_store_links(null, (err) => { if (err) { console.error("Game Import", err); } }, store_data);
						steam_controller.INSERT_UPDATE(null, (err) => { if (err) { console.error("Controller Import", err); } callback(); }, { appid: appid, ignore: 0, type: game_data.type });

						//console.log("overview_data", overview_data);
						//console.log("store_data", store_data);

						//console.log("orginal_data", game_data);

					} else {
						console.error("STEAM", "No Success for", appid);
						if (typeof types["No Success"] == "undefined") {
							types["No Success"] = 1;
						} else {
							types["No Success"]++;
						}
						steam_controller.INSERT_UPDATE(null, (err) => { if (err) { console.error("Controller Import", err); } callback(); }, { appid: appid, ignore: 1, type: "No Success" });
					}
				} catch (err) {
					console.error(err);
				}
			}
		} catch (err) {
			console.error("Parse", err, games_url);
		}
		callback();
	});
}

function imp() {

	async.series(
		[
			function (callback) {
				var tmp_type = "advertising";
				console.log("DELETEING ", tmp_type);
				steam_controller.SET_IGNORE(null, (err) => { if (err) { console.error(err); } game_db.delete_game_and_links_BYTYPE(null, (err) => { if (err) { console.error(err); } callback(); }, { type: tmp_type }); }, { type: tmp_type });
			},
			function (callback) {
				var tmp_type = "demo";
				console.log("DELETEING ", tmp_type);
				steam_controller.SET_IGNORE(null, (err) => { if (err) { console.error(err); } game_db.delete_game_and_links_BYTYPE(null, (err) => { if (err) { console.error(err); } callback(); }, { type: tmp_type }); }, { type: tmp_type });
			},
			function (callback) {
				var tmp_type = "dlc";
				console.log("DELETEING ", tmp_type);
				steam_controller.SET_IGNORE(null, (err) => { if (err) { console.error(err); } game_db.delete_game_and_links_BYTYPE(null, (err) => { if (err) { console.error(err); } callback(); }, { type: tmp_type }); }, { type: tmp_type });
			},
			function (callback) {
				var tmp_type = "episode";
				console.log("DELETEING ", tmp_type);
				steam_controller.SET_IGNORE(null, (err) => { if (err) { console.error(err); } game_db.delete_game_and_links_BYTYPE(null, (err) => { if (err) { console.error(err); } callback(); }, { type: tmp_type }); }, { type: tmp_type });
			},
			function (callback) {
				var tmp_type = "game";
				//console.log("DELETEING ", temp_type);
				//steam_controller.SET_IGNORE(null, (err) => { if (err) { console.error(err); } game_db.delete_game_and_links_BYTYPEcallback(null, null, (err) => { if (err) { console.error(err); } callback(); }, { type: tmp_type }); }, { type: tmp_type });
				callback();
			},
			function (callback) {
				var tmp_type = "hardware";
				console.log("DELETEING ", tmp_type);
				steam_controller.SET_IGNORE(null, (err) => { if (err) { console.error(err); } game_db.delete_game_and_links_BYTYPE(null, (err) => { if (err) { console.error(err); } callback(); }, { type: tmp_type }); }, { type: tmp_type });
			},
			function (callback) {
				var tmp_type = "mod";
				console.log("DELETEING ", tmp_type);
				steam_controller.SET_IGNORE(null, (err) => { if (err) { console.error(err); } game_db.delete_game_and_links_BYTYPE(null, (err) => { if (err) { console.error(err); } callback(); }, { type: tmp_type }); }, { type: tmp_type });
			},
			function (callback) {
				var tmp_type = "movie";
				console.log("DELETEING ", tmp_type);
				steam_controller.SET_IGNORE(null, (err) => { if (err) { console.error(err); } game_db.delete_game_and_links_BYTYPE(null, (err) => { if (err) { console.error(err); } callback(); }, { type: tmp_type }); }, { type: tmp_type });
			},
			function (callback) {
				var tmp_type = "series";
				console.log("DELETEING ", tmp_type);
				steam_controller.SET_IGNORE(null, (err) => { if (err) { console.error(err); } game_db.delete_game_and_links_BYTYPE(null, (err) => { if (err) { console.error(err); } callback(); }, { type: tmp_type }); }, { type: tmp_type });
			},
			function (callback) {
				var tmp_type = "video";
				console.log("DELETEING ", tmp_type);
				steam_controller.SET_IGNORE(null, (err) => { if (err) { console.error(err); } game_db.delete_game_and_links_BYTYPE(null, (err) => { if (err) { console.error(err); } callback(); }, { type: tmp_type }); }, { type: tmp_type });
			}
		]
		, function (e) {
			if (e) {
				console.error(e);
			}
			request_overview();
		});
}


queue.on('drain', function () {
	console.log("===============");
	console.log(types);
	console.log("===============");

	console.log("Game Import Done, Wating 1 Hour for Restart");
	setTimeout(() => { process.exit(0) }, 60 * 60 * 1000);	// 1 Stunde warten bevor Ende und Neustart
})