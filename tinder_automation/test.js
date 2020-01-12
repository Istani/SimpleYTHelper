var envpath = __dirname + "/../.env";
console.log("Settingspath:", envpath);
var config = require("dotenv").config({ path: envpath });
// process.env.FACEBOOK_LOGIN

var tinderbot = require("tinderbot");
var bot = new tinderbot();
var _ = require("underscore");

bot.FBClientId = "428253358080590";
bot.FBClientSecret = "3c0d38e6fead475293b0dee933cc4c6b";

// http://localhost:8080/fbtoken?#access_token=EAAGFfoFIQk4BAH9cpbJZAOYb1yfGb9aIaQH2j0bIwkjsBwrS7uAUxQTZApJ6gim7ImwagX5SfvB1R9CShle0jw2z2ZBJ6AuWlINEuVjtgMY8pckrDBdXLvtxNhD8KRZA6BvfXcpqZCNnCF0f4opzPfTWtn27flf3PHBqki3eMSAZDZD&data_access_expiration_time=1584473329&expires_in=5183999

bot.mainLoop = function() {
  console.log("Login?");
  bot.client.getRecommendations(10, function(error, data) {
    _.chain(data.results)
      .pluck("_id")
      .each(function(id) {
        console.log(id);
        bot.client.like(id, function(error, data) {
          if (data.matched) {
            bot.client.sendMessage(id, "Hey Ho");
          }
        });
      });
  });
};

bot.live();
