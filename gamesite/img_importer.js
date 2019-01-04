const Game = require("./models/game.js");
const Jimp = require("jimp");
const fs   = require("fs");

async function main() {
  const g = await Game.query().where({type:'game'}).orderBy('updated_at');
  for(var i = 0; i<g.length;i++) {
    await get_image(g[i]);
  }
  return;
}
async function get_image(game) {
  var pic_path="./public"+game.localBanner;
  if (fs.existsSync(pic_path)) {
    //console.log("Skip Import of",game.name);
  } else {
    console.log("Import of",game.name);
    await Jimp.read(game.banner).then(pic => {
      pic
        .scaleToFit(460, 215)
        .write(pic_path);
      return pic;
    }).catch(error => {
      console.error(error);
    });
  }
}

main();
