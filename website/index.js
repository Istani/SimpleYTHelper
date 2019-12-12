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
const session_secret = new Buffer(package_info.name).toString("base64");

/* Webserver */
var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var i18n = require("i18n");
var passport = require("passport");
var youtube_auth = require("./oauth/youtube.js");

var hbs = exphbs.create({
  helpers: {
    i18n: function(key, options) {
      var temp_data = {};
      temp_data.data = options;
      var result = i18n.__(key, options);
      result = result.split("[[").join("{{");
      result = result.split("]]").join("}}");
      //result = hbs.handlebars.escapeExpression(result);
      result = hbs.handlebars.compile(result); // Dann ist der String leer!
      result = result(temp_data);
      return result;
    }
  },
  defaultLayout: "main",
  extname: ".hbs"
});

var app = express();
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
app.use(express.static("public"));
app.use(function(req, res, next) {
  console.log("REQ:", req.url);
  next();
});

i18n.configure({
  defaultLocale: "de",
  cookie: "syth_language",
  directory: "./locales",
  queryParameter: "lang",
  extension: ".json"
});
app.use(i18n.init);

youtube_auth(passport);
app.get(
  "/auth/youtube",
  passport.authenticate("youtube", {
    scope: ["https://www.googleapis.com/auth/youtube"]
  })
);
app.get("/auth/youtube/callback", passport.authenticate("youtube"), function(
  req,
  res
) {
  var temp_data = {};
  async.parallel(
    [
      function(callback) {
        login.get_login(temp_data, callback, req.session.user);
      }
    ],
    function(err) {
      temp_data.new = {};
      temp_data.new.service = "youtube";
      temp_data.new.email = temp_data.login.email;
      temp_data.new.access = req.user.accessToken;
      temp_data.new.refresh = req.user.refreshToken;

      async.parallel(
        [
          function(callback) {
            oauth.set_oauth_user(temp_data, callback, temp_data.new);
          }
        ],
        function(err) {
          console.log(req.user);
          res.redirect("/Dashboard");
        }
      );
    }
  );
});

app.get("/Login", function(req, res) {
  var temp_data = {};
  res.render("login", { data: temp_data });
});
app.post("/Login", async function(req, res) {
  var temp_data = {};
  temp_data.login = await Login.query()
    .where("user", req.body.email)
    .where("pass", req.body.password);
  if (temp_data.login.length == 0) {
    delete temp_data.login;
  }

  if (temp_data.login === undefined) {
    temp_data.error = {};
    temp_data.error.code = "Wrong Login!";
    temp_data.error.text =
      "Wrong Login Information! Please Check your E-Mail and Password!";
    res.render("login", { data: temp_data });
  } else {
    req.session.user = temp_data.login;
    res.redirect("/Dashboard");
  }
});

app.get("/Register", function(req, res) {
  var temp_data = {};
  res.render("register", { data: temp_data });
});
app.post("/Register", async function(req, res) {
  // TODO: Daten auswerten
  var temp_data = {};
  var data = req.body;
  if (data.password != data.password_repeat || data.password == "") {
    var err = {};
    err.code = "Password did not Match!";
    err.text = "Please Check you Passwords!";
    temp_data.error = err;
  }
  if (data.email == "") {
    var err = {};
    err.code = "Email Empty!";
    err.text = "Please Check you E-Mail!";
    temp_data.error = err;
  }
  if (typeof data.AGB == "undefined") {
    var err = {};
    err.code = "AGB!";
    err.text = "Please Check our AGB!";
    temp_data.error = err;
  }

  var login = await Login.query().where("user", data.email);
  if (typeof temp_data.error == "undefined" && login.length > 0) {
    var err = {};
    err.code = "In Use!";
    err.text = "Your E-Mail Adress is already used!";
    temp_data.error = err;
  }
  if (typeof temp_data.error != "undefined") {
    console.log(req.originalUrl, ": ", temp_data.error.code);
    res.render("register", { data: temp_data });
    return;
  }
  var new_login = {};
  new_login.user = data.email;
  new_login.pass = data.password;
  if (typeof data.newsletter != "undefined") {
    new_login.is_newsletter = true;
  }
  new_login.activation_code = "";
  var currentuser = await Login.query().insert(new_login);
  req.session.user = currentuser;
  res.redirect("/Dashboard");
});

app.get("/Dashboard", async function(req, res) {
  var temp_data = {};
  if (req.session.user && req.cookies.login_check) {
    temp_data.login = req.session.user[0];
    console.log(temp_data);
    res.render("dashboard", { data: temp_data });
  } else {
    temp_data.error = {};
    temp_data.error.code = "Error";
    temp_data.error.text = i18n.__("Something went wrong!");
    res.render("error", { data: temp_data });
  }
});

app.get("/", function(req, res) {
  console.log("http://" + req.headers.host + req.url);
  var temp_data = {};
  res.render("home", { data: temp_data });
});

app.listen(3000, () => console.log("Webinterface running! Port: 3000"));
