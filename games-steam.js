const request=require("request");

var overview_url='http://api.steampowered.com/ISteamApps/GetAppList/v0001/';
var games_url='http://store.steampowered.com/api/appdetails';

function request_overview() {
request(overview_url, function (error, response, body) {
    console.log("Importing Gamelist");
    if (error) {
        console.error("Overview", error);
        process.exit(1);
    }
    try {
	var data=JSON.parse(body);
	data=data.applist.apps.app;
	data.forEach(function (game) {
    	    request_game(game.appid, game.name);
	});
    } catch(err) {
	console.error("Parse", err);
    }
});
}

function request_game(appid, name) {
    console.log("Game Import",appid,"-",name);
    var query_string = {
	appids:appid,
	cc:'de',
	l:'german'
    };
    request({
	url:games_url,
	qs:query_string
    }, function(err, response, body) {
  	if(err) {
		console.error("Get Game Details",err); 
		return;
	}
  	console.log(body);
    });

    //process.exit(2);
}
request_game(57690,"");
