process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

const request = require("request");

async function trigger() {
  request("https://syth-humble.herokuapp.com/", function(
    error,
    response,
    body
  ) {
    console.log("Trigger Start - Other Software writes direct to MySQL");
  });
}

setTimeout(() => {
  trigger();
}, 6 * 60 * 60 * 1000); // 6*1 Stunde warten bevor Start
trigger();
