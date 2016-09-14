exports.commands = [
    "defender",
    "deftime"
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

exports.deftime = {
    usage: "",
    description: "Time, Test!",
    process: function (bot, msg, suffix) {
        tmp_bot = bot;
        SayDefTime();
    }
}

var tmp_bot;
var lastSubAutoPost = "";
var newSubAutoPost = "";
function SayDefTime() {
    if (typeof tmp_bot != 'undefined') {
        for (var i = 0; i < tmp_bot.channels.length; i++) {
            if (tmp_bot.channels[i].name.indexOf("development") >= 0) {
                //tmp_bot.sendMessage(tmp_bot.channels[i], "Automatischer Post");

                if (lastSubAutoPost != newSubAutoPost) {
                    //tmp_bot.sendMessage(tmp_bot.channels[i], "New Sub: " + newSubAutoPost);
                    lastSubAutoPost = newSubAutoPost;
                }

            }
        }
    }
    var url = 'https://zod-cod.safe-ws.de/do.php?command=lastsub';
    fetch(url).then(function (res) {
        return res.text();
    }).then(function (body) {
        newSubAutoPost = body;
    }
    );
    setTimeout(SayDefTime, 5000);
}