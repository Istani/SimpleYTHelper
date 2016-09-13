exports.commands = [
	"defender"
]

var fetch = require('node-fetch');
	
exports.defender = {
	usage : "<command>",
	description : "Try to fetch command for Defender (Nightbot)",
	process : function(bot,msg,suffix) {
			console.log(bot);
			console.log();
			console.log(msg);
			console.log();
			console.log(suffix);
			console.log();
			
			fetch('https://zod-cod.safe-ws.de/do.php?command=debug')
    .then(function(res) {
        return res.text();
    }).then(function(body) {
        console.log(body);
		bot.sendMessage(msg.channel, body) ;
    });
        
	}
}