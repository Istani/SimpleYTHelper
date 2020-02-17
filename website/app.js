process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();
const config = require("dotenv").config({ path: "../.env" });
const PORT = 3001;

/* Node Functions */
const async = require("async");

const Login = require("./models/syth_login.js");
const Token = require("./models/syth_token.js");
const User_Channel = require("./models/channel.js");
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
var twitch_auth = require("./oauth/twitch.js");
var discord_auth = require("./oauth/discord.js");

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
var server = require("http").createServer(app);
var io = require("socket.io")(server);

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
app.use(express.static("public"));
app.use(function(req, res, next) {
  req.app.locals.layout = "main";
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
twitch_auth(passport);
discord_auth(passport);
app.get(
  "/auth/youtube",
  passport.authenticate("youtube", {
    scope: ["https://www.googleapis.com/auth/youtube"]
  })
);
app.get(
  "/auth/youtube/callback",
  passport.authenticate("youtube"),
  async function(req, res) {
    var temp_data = {};
    console.log(req.user.profile);
    if (req.session.user) {
      temp_data.service = "youtube";
      temp_data.user_id = req.session.user[0].id;
      temp_data.access_token = req.user.accessToken;
      temp_data.refresh_token = req.user.refreshToken;
      temp_data.service_user = req.user.profile.id;

      await Token.query().insert(temp_data);

      res.redirect("/Dashboard");
    } else {
      temp_data.error = {};
      temp_data.error.code = "Error";
      temp_data.error.text = i18n.__("Something went wrong!");
      res.render("error", { data: temp_data });
    }
  }
);

app.get(
  "/auth/twitch",
  passport.authenticate("twitch", {
    scope: [
      "chat:read chat:edit clips:edit bits:read analytics:read:games channel:read:subscriptions user:read:broadcast user:read:email analytics:read:extensions channel:moderate"
    ]
  })
);
app.get(
  "/auth/twitch/callback",
  passport.authenticate("twitch"),
  async function(req, res) {
    var temp_data = {};
    console.log(req.user.profile);
    if (req.session.user) {
      temp_data.service = "twitch";
      temp_data.user_id = req.session.user[0].id;
      temp_data.access_token = req.user.accessToken;
      temp_data.refresh_token = req.user.refreshToken;
      temp_data.service_user = req.user.profile.id;

      await Token.query().insert(temp_data);

      res.redirect("/Dashboard");
    } else {
      temp_data.error = {};
      temp_data.error.code = "Error";
      temp_data.error.text = i18n.__("Something went wrong!");
      res.render("error", { data: temp_data });
    }
  }
);
app.get(
  "/auth/discord",
  passport.authenticate("discord", { scope: "identify" })
);
app.get(
  "/auth/discord/callback",
  passport.authenticate("discord"),
  async function(req, res) {
    var temp_data = {};
    console.log(req.user.profile);
    if (req.session.user) {
      temp_data.service = "discord";
      temp_data.user_id = req.session.user[0].id;
      temp_data.access_token = req.user.accessToken;
      temp_data.refresh_token = req.user.refreshToken;
      temp_data.service_user = req.user.profile.id;

      await Token.query().insert(temp_data);

      res.redirect("/Dashboard");
    } else {
      temp_data.error = {};
      temp_data.error.code = "Error";
      temp_data.error.text = i18n.__("Something went wrong!");
      res.render("error", { data: temp_data });
    }
  }
);

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
  // ToDo: Daten auswerten
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
    //console.log(req.originalUrl, ": ", temp_data.error.code);
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
  if (req.session.user) {
    // Schauen ob der User auch Existiert?
    temp_data.login = req.session.user[0];
    temp_data.current = [];
    var temp_token = await Token.query()
      .where("user_id", req.session.user[0].id)
      .eager("[channel]");
    for (let token_index = 0; token_index < temp_token.length; token_index++) {
      const element = temp_token[token_index];
      if (typeof element.channel[0] != "undefined") {
        temp_data.current[token_index] = {
          name: element.channel[0].channel_title,
          service: element.service
        };
      } else {
        temp_data.current[token_index] = {
          name: "No Data!",
          service: element.service
        };
      }
    }
    //console.log(temp_data);
    res.render("dashboard", { data: temp_data });
  } else {
    temp_data.error = {};
    temp_data.error.code = "Error";
    temp_data.error.text = i18n.__("Something went wrong!");
    res.render("error", { data: temp_data });
  }
});

app.get("/HUD/:channel/:category", async function(req, res, next) {
  var temp_data = {};
  temp_data.error = {};
  temp_data.error.code = "Error";
  temp_data.error.text = i18n.__("Something went wrong!");

  req.app.locals.layout = "hud";
  var param_channel = req.params.channel;
  var param_category = req.params.category;

  if (param_category.startsWith("Rpg")) {
    // RPG HUD
    try {
      var data = await User_Channel.query().where("channel_id", param_channel);
    } catch (e) {
      console.error(e);
      var data = [];
    }
    if (data.length == 0) {
      res.render("error", { data: temp_data });
      return;
    }
    var temp_data = {};
    temp_data.user = data[0].user_id;
    res.render("hub_" + param_category, { data: temp_data });
    return;
  } else {
    // Service HUD
    try {
      var data = await User_Channel.query()
        .where("channel_id", param_channel)
        .eager(param_category);
    } catch (e) {
      console.error(e);
      var data = [];
    }
    if (data.length > 0) {
      var temp_data = {};
      temp_data.data = [];
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        for (let index = 0; index < element[param_category].length; index++) {
          const element2 = element[param_category][index];
          var tmp_data = {
            name: element2.member_name,
            since: element2.since,
            length_month:
              parseInt(
                (new Date() - element2.since) / 1000 / 60 / 60 / 24 / 30
              ) + 1
          };
          temp_data.data.push(tmp_data);
        }
        temp_data.data.sort((a, b) => {
          if (a.since < b.since) {
            return -1;
          }
          if (a.since > b.since) {
            return 1;
          }
          return 0;
        });
      }
      console.log(temp_data);
      res.render("hub_" + param_category, { data: temp_data });
      return;
    }
  }
  res.render("error", { data: temp_data });
});

app.get("/", function(req, res) {
  console.log("http://" + req.headers.host + req.url);
  var temp_data = {};
  res.render("home", { data: temp_data });
});

server.listen(PORT, () => console.log("Webinterface running! Port: " + PORT));
