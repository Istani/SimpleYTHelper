var envpath = __dirname + "/../.env";
console.log("Settingspath:", envpath);
var config = require("dotenv").config({ path: envpath });

var tc = require("tinder-client");

(async function main() {
  const client = await tc.createClientFromFacebookLogin({
    emailAddress: process.env.FACEBOOK_LOGIN,
    password: process.env.FACEBOOK_PASS
  });

  const profile = await client.getProfile();
  //console.log(profile);

  const recommendations = await client.getRecommendations();
  console.log("Recom:", recommendations.results.length);

  for (var i = 0; i < recommendations.results.length; i++) {
    var perso = recommendations.results[i];
    console.log(perso);
    //console.log(perso._id);
    process.exit(0);
  }
})();
