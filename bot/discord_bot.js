try {
    var Discord = require("discord.js");
} catch (e) {
    console.log(e.stack);
    console.log(process.version);
    console.log("Please run npm install and ensure it passes with no errors!");
    process.exit();
}

// Get authentication data
try {
    var AuthDetails = require("./auth.json");
} catch (e) {
    console.log("Please create an auth.json like auth.json.example with a bot token or an email and password.\n" + e.stack);
    process.exit();
}

// Load custom permissions
var Permissions = {};
try {
    Permissions = require("./permissions.json");
} catch (e) {
}
Permissions.checkPermission = function (user, permission) {
    try {
        var allowed = false;
        try {
            if (Permissions.global.hasOwnProperty(permission)) {
                allowed = Permissions.global[permission] == true;
            }
        } catch (e) {
        }
        try {
            if (Permissions.users[user.id].hasOwnProperty(permission)) {
                allowed = Permissions.users[user.id][permission] == true;
            }
        } catch (e) {
        }
        return allowed;
    } catch (e) {
    }
    return false;
}

//load config data
var Config = {};
try {
    Config = require("./config.json");
} catch (e) { //no config file, use defaults
    Config.debug = false;
    Config.respondToInvalid = false;
}

var htmlToText = require('html-to-text');

var startTime = Date.now();

var aliases;
var messagebox;

var commands = {
    "ping": {
        description: "responds pong, useful for checking if bot is alive",
        process: function (bot, msg, suffix) {
            bot.sendMessage(msg.channel, msg.sender + " pong!");
            if (suffix) {
                bot.sendMessage(msg.channel, "note that !ping takes no arguments!");
            }
        }
    },
    "servers": {
        description: "lists servers bot is connected to",
        process: function (bot, msg) {
            bot.sendMessage(msg.channel, bot.servers);
        }
    },
    "myid": {
        description: "returns the user id of the sender",
        process: function (bot, msg) {
            bot.sendMessage(msg.channel, msg.author.id);
        }
    },
    "announce": {
        usage: "<message>",
        description: "bot says message with text to speech",
        process: function (bot, msg, suffix) {
            bot.sendMessage(msg.channel, suffix, {tts: true});
        }
    },
    "version": {
        description: "returns the git commit this bot is running",
        process: function (bot, msg, suffix) {
            var commit = require('child_process').spawn('git', ['log', '-n', '1']);
            commit.stdout.on('data', function (data) {
                bot.sendMessage(msg.channel, data);
            });
            commit.on('close', function (code) {
                if (code != 0) {
                    bot.sendMessage(msg.channel, "failed checking git version!");
                }
            });
        }
    },
    "join-server": {
        usage: "<invite>",
        description: "joins the server it's invited to",
        process: function (bot, msg, suffix) {
            console.log(bot.joinServer(suffix, function (error, server) {
                console.log("callback: " + arguments);
                if (error) {
                    bot.sendMessage(msg.channel, "failed to join: " + error);
                    bot.sendMessage(msg.author, "https://discordapp.com/oauth2/authorize?client_id=225365144497029125&scope=bot&permissions=0 for activate!");
                } else {
                    console.log("Joined server " + server);
                    bot.sendMessage(msg.channel, "Successfully joined " + server);
                }
            }));
        }
    },
    "msg": {
        usage: "<user> <message to leave user>",
        description: "leaves a message for a user the next time they come online",
        process: function (bot, msg, suffix) {
            var args = suffix.split(' ');
            var user = args.shift();
            var message = args.join(' ');
            if (user.startsWith('<@')) {
                user = user.substr(2, user.length - 3);
            }
            var target = msg.channel.server.members.get("id", user);
            if (!target) {
                target = msg.channel.server.members.get("username", user);
            }
            messagebox[target.id] = {
                channel: msg.channel.id,
                content: target + ", " + msg.author + " said: " + message
            };
            updateMessagebox();
            bot.sendMessage(msg.channel, "message saved.")
        }
    },
    "uptime": {
        usage: "",
        description: "returns the amount of time since the bot started",
        process: function (bot, msg, suffix) {
            var now = Date.now();
            var msec = now - startTime;
            console.log("Uptime is " + msec + " milliseconds");
            var days = Math.floor(msec / 1000 / 60 / 60 / 24);
            msec -= days * 1000 * 60 * 60 * 24;
            var hours = Math.floor(msec / 1000 / 60 / 60);
            msec -= hours * 1000 * 60 * 60;
            var mins = Math.floor(msec / 1000 / 60);
            msec -= mins * 1000 * 60;
            var secs = Math.floor(msec / 1000);
            var timestr = "";
            if (days > 0) {
                timestr += days + " days ";
            }
            if (hours > 0) {
                timestr += hours + " hours ";
            }
            if (mins > 0) {
                timestr += mins + " minutes ";
            }
            if (secs > 0) {
                timestr += secs + " seconds ";
            }
            bot.sendMessage(msg.channel, "Uptime: " + timestr);
        }
    },
    "pullanddeploy": {
        description: "bot will perform a git pull master and restart with the new code",
        process: function (bot, msg, suffix) {
            bot.sendMessage(msg.channel, "fetching updates...", function (error, sentMsg) {
                console.log("updating...");
                var spawn = require('child_process').spawn;
                var log = function (err, stdout, stderr) {
                    if (stdout) {
                        console.log(stdout);
                    }
                    if (stderr) {
                        console.log(stderr);
                    }
                };
                var fetch = spawn('git', ['fetch']);
                fetch.stdout.on('data', function (data) {
                    console.log(data.toString());
                });
                fetch.on("close", function (code) {
                    var reset = spawn('git', ['reset', '--hard', 'origin/master']);
                    reset.stdout.on('data', function (data) {
                        console.log(data.toString());
                    });
                    reset.on("close", function (code) {
                        var npm = spawn('npm', ['install']);
                        npm.stdout.on('data', function (data) {
                            console.log(data.toString());
                        });
                        npm.on("close", function (code) {
                            console.log("goodbye");
                            bot.sendMessage(msg.channel, "brb!", function () {
                                bot.logout(function () {
                                    process.exit();
                                });
                            });
                        });
                    });
                });
            });
        }
    }
};

try {
    aliases = require("./alias.json");
} catch (e) {
    aliases = {};
}

try {
    messagebox = require("./messagebox.json");
} catch (e) {
    messagebox = {};
}
function updateMessagebox() {
    require("fs").writeFile("./messagebox.json", JSON.stringify(messagebox, null, 2), null);
}

var bot = new Discord.Client();

bot.on("ready", function () {
//loadFeeds();
    console.log("Ready to begin! Serving in " + bot.channels.length + " channels");
    require("./plugins.js").init();
    for (var i = 0; i < bot.channels.length; i++) {
        if (bot.channels[i].name.indexOf("development") >= 0) {
            console.log("Greetings *DEVELOPMENT* Channels");
            bot.sendMessage(bot.channels[i], "Bot Successfully Connected!");
        }
    }
    /*
     * HIER KOMMEN DANN SACHEN HIN DIE BEIM STARTEN PASSIEREN SOLLEN! (Bot Start)
     */
    bot.setStatus('online', "SimpleYTH");
});
bot.on("disconnected", function () {
    console.log("Disconnected!");
    process.exit(1);
});
bot.on("message", function (msg) {
    if (msg.author.id != bot.user.id && (msg.content[0] === '!' || msg.content.indexOf(bot.user.mention()) == 0)) {
        console.log("treating " + msg.content + " from " + msg.author + " as command");
        var cmdTxt = msg.content.split(" ")[0].substring(1);
        var suffix = msg.content.substring(cmdTxt.length + 2); //add one for the ! and one for the space
        if (msg.content.indexOf(bot.user.mention()) == 0) {
            try {
                cmdTxt = msg.content.split(" ")[1];
                suffix = msg.content.substring(bot.user.mention().length + cmdTxt.length + 2);
            } catch (e) { //no command
                bot.sendMessage(msg.channel, "Yes?");
                return;
            }
        }
        alias = aliases[cmdTxt];
        if (alias) {
            console.log(cmdTxt + " is an alias, constructed command is " + alias.join(" ") + " " + suffix);
            cmdTxt = alias[0];
            suffix = alias[1] + " " + suffix;
        }
        var cmd = commands[cmdTxt];
        if (cmdTxt === "help") {
            bot.sendMessage(msg.author, "Available Commands:", function () {
                for (var cmd in commands) {
                    var info = "!" + cmd;
                    var usage = commands[cmd].usage;
                    if (usage) {
                        info += " " + usage;
                    }
                    var description = commands[cmd].description;
                    if (description) {
                        info += "\n\t" + description;
                    }
                    bot.sendMessage(msg.author, info);
                }
            });
        } else if (cmd) {
            try {
                cmd.process(bot, msg, suffix);
            } catch (e) {
                if (Config.debug) {
                    bot.sendMessage(msg.channel, "command " + cmdTxt + " failed :(\n" + e.stack);
                }
            }
        } else {
            if (Config.respondToInvalid) {
                bot.sendMessage(msg.channel, "Invalid command " + cmdTxt);
            }
        }
    } else {
        if (msg.author == bot.user) {
            return;
        }
        if (msg.author != bot.user && msg.isMentioned(bot.user)) {
            bot.sendMessage(msg.channel, msg.author + ", you called?");
        }
    }
});
bot.on("presence", function (user, status, gameId) {
    console.log(user + " went " + status);
    try {
        if (status != 'offline') {
            if (messagebox.hasOwnProperty(user.id)) {
                console.log("found message for " + user.id);
                var message = messagebox[user.id];
                var channel = bot.channels.get("id", message.channel);
                delete messagebox[user.id];
                updateMessagebox();
                bot.sendMessage(channel, message.content);
            }
        }
    } catch (e) {
    }
});
exports.addCommand = function (commandName, commandObject) {
    try {
        commands[commandName] = commandObject;
    } catch (err) {
        console.log(err);
    }
}
exports.commandCount = function () {
    return Object.keys(commands).length;
}
if (AuthDetails.bot_token) {
    console.log("logging in with token");
    bot.loginWithToken(AuthDetails.bot_token);
} else {
    console.log("Logging in as a user account. Consider switching to an official bot account instead!");
    bot.login(AuthDetails.email, AuthDetails.password);
}
