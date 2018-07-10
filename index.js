/* Node Functions */
const fs = require('fs');
const async = require('async');

const package = require('./package.json');
const login = require("./models/login.js");
const oauth = require("./models/login_oauth.js");
const session_secret = new Buffer(package.name).toString("base64");

/* Cronjob QUEUE */
var cron = require('node-cron');
var queue_class = require('better-queue');
var queue = new queue_class(function (func, cb) {
    func();
    cb(null, result);
});
cron.schedule('0 0 0 * * *', function () {
    queue.push(() => {
        console.log('Daily Backup');
        // TODO: Backup!
    });
});

/* Webserver */
var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var i18n = require("i18n");
var passport = require('passport');
var youtube_auth = require('./oauth/youtube.js');

var hbs = exphbs.create({
    helpers: {
        i18n: function (key, options) {
            var temp_data = {}
            temp_data.data = options;
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
app.use(passport.initialize());
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

youtube_auth(passport);
app.get('/auth/youtube', passport.authenticate('youtube', {
    scope: ['https://www.googleapis.com/auth/youtube']
}));
app.get('/auth/youtube/callback', passport.authenticate('youtube'), function (req, res) { res.redirect('/Dashboard'); });

app.get('/Login', function (req, res) {
    var temp_data = {};
    res.render('login', { data: temp_data });
});
app.post('/Login', function (req, res) {
    var temp_data = {};
    async.parallel([
        function (callback) { login.check_login(temp_data, callback, req.body); },
    ], function (err) {
        if (err) {
            console.log("ERROR", err);
            temp_data.error = {};
            temp_data.error.code = err.code;
            temp_data.error.text = err.sqlMessage;
            res.render('error', { data: temp_data });
        }
        if (temp_data.login === undefined) {
            res.render('login', { data: temp_data });
        } else {
            // TODO: Login Cookie Setzen?
            req.session.user = temp_data.login;
            res.redirect('/Dashboard');
        }
    });
});

app.get('/Register', function (req, res) {
    var temp_data = {};
    res.render('register', { data: temp_data });
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
            res.render('register', { data: temp_data });
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
            function (callback) { oauth.get_services(temp_data, callback); },
            function (callback) { oauth.get_oauth_user(temp_data, callback, req.session.user.email); },
        ], function (err) {
            if (err) {
                console.log("ERROR", err);
                temp_data.error = {};
                temp_data.error.code = err.code;
                temp_data.error.text = err.sqlMessage;
                res.render('error', { data: temp_data });
            }
            console.log(temp_data);
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
    console.log("http://" + req.headers.host + req.url);
    var temp_data = {};
    res.render('home', { data: temp_data });
});

app.use(function (req, res, next) {
    fs.readFile(__dirname + '/www' + req.url, function (err, data) {
        if (err) {
            var temp_data = {};
            err.text = "Could not open: " + req.url;
            temp_data.error = err;
            console.log("404 Error: ", JSON.stringify(temp_data));
            console.log("Datei nicht Gefunden: " + __dirname + '/www' + req.url);
            res.render('error', { data: temp_data });
            return;
        }
        res.write(data);
        return res.end();
    });
});

app.listen(3000, () => console.log('Webinterface running!'));