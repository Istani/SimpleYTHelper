const package_info = require('./package.json');
const Game = require("./models/game.js");
const Jimp = require("jimp");
const fs   = require("fs");

async function main() {
  const g = await Game.query().where({type:'game'}).orderBy('updated_at');
  for(var i = 0; i<g.length;i++) {
    //await get_image(g[i]);
  }
  //await gen_text();
  await gen_no_pic();
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
    }).catch(error => {
      console.error(error);
    });
  }
}
async function gen_text() {
  var font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
  var widht = Jimp.measureText(font, package_info.name);
  var height = Jimp.measureTextHeight(font, package_info.name, 100);
  var offset = 8;
  var offset_fix=0;
  var pic = new Jimp(widht+offset, height+offset, 0xFFFFFF00);

  for (var i=offset_fix;i<offset-offset_fix;i++) {
    for (var j=offset_fix;j<offset-offset_fix;j++) {
      pic.print(font, i, j, package_info.name);
    }
  }
  pic.color([
    {apply:'blue',params:[-0xff]}
  ]);

  offset_fix=parseInt(offset/4);
  for (var i=offset_fix;i<offset-offset_fix;i++) {
    for (var j=offset_fix;j<offset-offset_fix;j++) {
      pic.print(font, i, j, package_info.name);
    }
  }
  pic.color([
    {apply:'red',params:[-0xff]},
    {apply:'green',params:[-0xff]}
  ]);

  offset_fix=offset/2;
  pic.print(font, offset_fix, offset_fix, package_info.name);

  pic.write('./public/img/text.png');
  console.log('text done');
}
async function gen_no_pic() {
  var font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
  var widht = Jimp.measureText(font, '?');
  var height = Jimp.measureTextHeight(font, '?');
  var text = await Jimp.read('./public/img/text.png');

  var pic = new Jimp(widht,height,0xFFFFFFFF);
  pic.print(font,0,0,'?');
  pic.resize(460,215);

  text.scaleToFit(460,215);
  text.fade(0.5);

  pic.composite(text,(pic.bitmap.width-text.bitmap.width)/2, (pic.bitmap.height-text.bitmap.height)/2);

  pic.write('./public/img/games/no_pic.jpg');
  console.log('no pic done');
}
main();
