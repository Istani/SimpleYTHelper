/* Node Functions */
const fs = require('fs');
const async = require('async');


const package = require('./package.json');
const login = require("./models/login.js");
const session_secret = new Buffer(package.name).toString("base64");


/* Webserver */
var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    key: 'login_check',
    secret: session_secret,
    resave: true,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));


i18n.configure({
    defaultLocale: 'de',
    cookie: 'syth_language',
    directory: './locales',
    queryParameter: 'lang',
    extension: '.json'
});
app.use(i18n.init);

app.post('/Login', function (req, res) {
    var temp_data = {};
    async.parallel([
        function (callback) { login.get_login(temp_data, callback, req.body); },
    ], function (err) {
        if (err) {
            console.log("ERROR", err);
            temp_data.error = {};
            temp_data.error.code = err.code;
            temp_data.error.text = err.sqlMessage;
            res.render('error', { data: temp_data });
        }
        if (temp_data.login === undefined) {
            res.render('/Login', {
                data: temp_data
            });
        } else {
            // TODO: Login Cookie Setzen?
            req.session.user = temp_data.login;
            res.redirect('/Dashboard');

        }
    });
});

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
        function (callback) { login.register_new(temp_data, callback, req.body); },
    ], function (err) {
        if (err) {
            console.log("ERROR", err);
            temp_data.error = {};
            temp_data.error.code = err.code;
            temp_data.error.text = err.sqlMessage;
        }
        if (temp_data.register != true) {
            res.render('register', {
                data: temp_data
            });
        } else {
            // TODO: Login Cookie Setzen?
            req.session.user = temp_data.currentuser;
            res.redirect('/Dashboard');

        }
    });
});

app.get('/Dashboard', function (req, res) {
    var temp_data = {};
    if (req.session.user && req.cookies.login_check) {
        async.parallel([
            function (callback) { login.get_login(temp_data, callback, req.session.user); },
        ], function (err) {
            console.log(req.session.user);
            if (err) {
                console.log("ERROR", err);
                temp_data.error = {};
                temp_data.error.code = err.code;
                temp_data.error.text = err.sqlMessage;
                res.render('error', { data: temp_data });
            }
            res.render('dashboard', { data: temp_data });
        });

    } else {
        temp_data.error = {};
        temp_data.error.code = "Error";
        temp_data.error.text = i18n.__("Something went wrong!");
        res.render('error', { data: temp_data });
    }
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
