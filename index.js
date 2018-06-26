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

var db = require("./db.js");
db.connect(
    process.env.DB_HOST,
    process.env.DB_USER,
    process.env.DB_PASS,
    process.env.DB_NAME,
    (err) => {
        if (err) {
            console.log('Unable to connect to MySQL.');
            console.log('Error:', err);
            process.exit(1);
        } else {
            console.log('Connect to MySQL established.');
        }
    }
);

var express = require('express');
var exphbs = require('express-handlebars');
var i18n = require("i18n");

var app = express();

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

i18n.configure({
    defaultLocale: 'de',
    cookie: 'syth_language',
    directory: './locales',
    queryParameter: 'lang',
    extension: '.json'
});
app.use(i18n.init);

var hbs = exphbs.create({
    helpers: {
        __: function () {
            return i18n.__.apply(this, arguments);
        }
    }
});

app.get('/', function (req, res) {
    res.render('home');
});

// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
    fs.readFile(__dirname + '/www/' + req.url, function (err, data) {
        if (err) {
            console.log("Datei nicht gefunden! " + __dirname + '/www' + req.url);
            res.render('404');
            return;
        }
        res.write(data);
        return res.end();
    });
});

app.listen(3000, () => console.log('Webinterface running!'));