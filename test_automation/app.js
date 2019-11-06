var envpath = __dirname + "/../.env";
console.log("Settingspath:", envpath);
var config = require("dotenv").config({ path: envpath });

var createClientFromFacebookLogin = require("tinder-client")
  .createClientFromFacebookLogin;

(async function main() {
  const client = await createClientFromFacebookLogin({
    emailAddress: process.env.FACEBOOK_LOGIN,
    password: process.env.FACEBOOK_PASS
  });

  const profile = await client.getProfile();
  console.log(profile);
})();
