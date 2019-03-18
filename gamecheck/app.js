process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version+')';
console.log(software);
console.log("===");
console.log();
