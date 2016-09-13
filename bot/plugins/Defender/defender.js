exports.commands = [
    "defender"
];

var fetch = require('node-fetch');

exports.defender = {
    usage: "<command>",
    description: "Try to fetch command for Defender (Nightbot)",
    process: function (bot, msg, suffix) {
        var commandstring = "defender";
        var tmp_string = msg.content;

        var tmp_array = tmp_string.split(commandstring);
        var parameter = tmp_string.replace(tmp_array[0] + commandstring, '');

        var url = 'https://zod-cod.safe-ws.de/do.php?command=';
        url = url + parameter.trim();
        fetch(url).then(function (res) {
            return res.text();
        }).then(function (body) {
            bot.sendMessage(msg.channel, body);
        });

    }
}