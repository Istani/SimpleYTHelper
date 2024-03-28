process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require("dotenv").config({ path: "../.env" });

/* Node Functions */
const async = require("async");

const Login = require("./models/syth_login.js");
const Token = require("./models/syth_token.js");
const User_Channel = require("./models/channel.js");
const Chat = require("./models/chat_message.js");

const PORT = 3123;
const session_secret = new Buffer(package_info.name).toString("base64");

/* Webserver */
var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var i18n = require("i18n");
var passport = require("passport");
// var youtube_auth = require("./oauth/youtube.js");

var hbs = exphbs.create({
  helpers: {
    i18n: function(key, options) {
      var temp_data = {};
      temp_data.data = options;
      var result = i18n.__(key, options);
      result = result.split("[[").join("{{");
      result = result.split("]]").join("}}");
      result = hbs.handlebars.compile(result);
      result = result(temp_data);
      return result;
    }
  },
  defaultLayout: "main",
  extname: ".hbs"
});

var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", function(socket) {
  console.log("Connection");
  socket.emit("debug", { text: "connection" });
  socket.on("message", function(func, data) {
    console.log(func, ":", data);
  });
  socket.on("disconnect", function() {});
});

app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(cookieParser());
app.use(
  session({
    key: "login_check",
    secret: session_secret,
    resave: true,
    saveUninitialized: false,
    cookie: {
      expires: 600000
    }
  })
);
app.use(express.static("../website/public"));
app.use(function(req, res, next) {
  req.custom_data = {};
  req.custom_data.url = "http://games-on-sale.de:3123/";
  console.log("REQ:", req.url);
  next();
});
i18n.configure({
  defaultLocale: "de",
  cookie: "syth_language",
  directory: "../website/locales",
  queryParameter: "lang",
  extension: ".json"
});
app.use(i18n.init);

app.get("/", function(req, res) {
  res.render("home", { data: req.custom_data });
});

server.listen(PORT, () => console.log("Webinterface running! Port: " + PORT));
