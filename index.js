/* Checking Example File for New Data! */
var config = require('dotenv').config();
var fs = require('fs');
var config_example = "";
if (fs.existsSync("./.env")) {
    for (var attributename in config.parsed) {
        config_example += attributename + "=\r\n";
    }
    fs.writeFileSync('./.env.example', config_example);
} else {
    //fs.copyFileSync("./.env.example", ".env");
    console.log("Update .env Files first!");
    process.exit(1);
}
/* Example File Finish */


var async = require('async');
const db = require('./db.js');
var login = require("./models/login.js");
/* Beispiel SQL */


/* Webserver */
var express = require('express');
var exphbs = require('express-handlebars');
var i18n = require("i18n");

var hbs = exphbs.create({
    helpers: {
        i18n: function (key, options) {
            var temp_data = {}
            temp_data.data = options;
            //var result = i18n.__(key, temp_data);
            var result = i18n.__(key, options);
            result = result.split("[[").join("{{");
            result = result.split("]]").join("}}");
            //result = hbs.handlebars.escapeExpression(result);
            result = hbs.handlebars.compile(result);   // Dann ist der String leer!
            result = result(temp_data);
            return result;
        }
    },
    defaultLayout: 'main',
    extname: '.hbs'
});

var app = express();

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');


i18n.configure({
    defaultLocale: 'de',
    cookie: 'syth_language',
    directory: './locales',
    queryParameter: 'lang',
    extension: '.json'
});
app.use(i18n.init);

app.get('/Register', function (req, res) {
    var temp_data = {}

    res.render('register', {
        data: temp_data
    });
});

app.post('/Register', function (req, res) {
    // TODO: Daten auswerten
    var temp_data = {};
    async.parallel([
        function (callback) { login.register_new(temp_data, callback); },
    ], function (err) {
        if (err) {
            temp_data.error = {};
            temp_data.error.code = "Error";
            temp_data.error.text = i18n.__("Something went wrong!");
        }
        db.end();
        if (temp_data.register != true) {
            res.render('register', {
                data: temp_data
            });
        } else {
            // TODO: Weiterleiten?
            res.render('dashboard', {
                data: temp_data
            });
        }
    });
});

app.get('/', function (req, res) {
    var temp_data = {}
    temp_data.user = { name: "Test", currentuser: "x" };

    res.render('home', {
        data: temp_data
    });
});

// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
    fs.readFile(__dirname + '/www' + req.url, function (err, data) {
        if (err) {
            var temp_data = {};
            err.text = "Could not open: " + req.url;
            temp_data.error = err;
            console.log("404 Error: ", JSON.stringify(temp_data));
            console.log("Datei nicht Gefunden: " + __dirname + '/www' + req.url);
            //if (err) {

            res.render('error', { data: temp_data });
            return;
        }
        res.write(data);
        return res.end();
    });
});

app.listen(3000, () => console.log('Webinterface running!'));
