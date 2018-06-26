/* Checking Example File for New Data! */
var config = require('dotenv').config();
var fs = require('fs');
var config_example = "";
for (var attributename in config.parsed) {
    config_example += attributename + "=\r\n";
}
fs.writeFileSync('./.env.example', config_example);
/* Example File Finish */

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
    extension: '.js'
});
app.use(i18n.init);

var hbs = exphbs.create({
    helpers: {
        __: function () {
            return i18n.__.apply(this,
                arguments);
        }
    }
});

app.get('/', function (req, res) {
    res.render('home');
});

app.listen(3000, () => console.log('Webinterface Gestartet!'));