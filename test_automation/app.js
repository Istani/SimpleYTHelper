process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + ' (V ' + package_info.version + ')';
console.log(software);
console.log('===');
console.log();

const tclient = require('tinder-client');

async function test() {
  const client = await tclient.createClientFromFacebookLogin({
    emailAddress: '',
    password: '',
  });
  const profile = await client.getProfile();
  console.log(profile);
}
test();