var request = require('request');

request({
  url: 'https://api.someapi.com/oauth/token',
  method: 'POST',
  auth: {
    user: 'xxx',
    pass: 'yyy'
  },
  form: {
    'grant_type': 'client_credentials'
  }
}, function (err, res) {
  var json = JSON.parse(res.body);
  console.log("Access Token:", json.access_token);
});

/* ----------------------------------------------------------------- */

var request = require('request');
var accessToken = 'ACCESS_TOKEN_HERE';

request({
  url: 'https://api.someapi.com/blah/something',
  auth: {
    'bearer': accessToken
  }
}, function (err, res) {
  console.log(res.body);
});

/* ----------------------------------------------------------------- */