const package_info = require("./package.json");
const Game = require("./models/game.js");
const Link = require("./models/game_link.js");
const Jimp = require("jimp");
const fs = require("fs");

async function main() {
  await gen_text();
  //await gen_no_pic();
  /*await gen_banner();
  const g = await Game.query()
    .where({ type: "game" })
    .orderBy("updated_at");
  for (var i = 0; i < g.length; i++) {
    //await get_image(g[i]);
  }
  */
}
async function get_image(game) {
  var pic_path = "./public/img/games/" + game.name + ".png";
  if (fs.existsSync(pic_path)) {
    //console.log("Skip Import of",game.name);
  } else {
    console.log("Import of", game.name);
    await Jimp.read(game.banner)
      .then(pic => {
        pic.scaleToFit(460, 215).write(pic_path);
      })
      .catch(error => {
        console.error(error);
      });
  }
}
async function gen_text() {
  var FontFile = ".\\public\\fonts\\font.fnt"; // Mit Bindestrich im Namen hatte des irgendwie ein Problem!
  var font = await Jimp.loadFont(FontFile);
  var widht = Jimp.measureText(font, package_info.name);
  var height = Jimp.measureTextHeight(font, package_info.name, 100);
  var offset = 8;
  var offset_fix = 0;
  var pic = new Jimp(widht + offset, height + offset, 0xffffff00);

  for (var i = offset_fix; i < offset - offset_fix; i++) {
    for (var j = offset_fix; j < offset - offset_fix; j++) {
      pic.print(font, i, j, package_info.name);
    }
  }
  pic.color([{ apply: "blue", params: [-0xff] }]);

  offset_fix = parseInt(offset / 4);
  for (var i = offset_fix; i < offset - offset_fix; i++) {
    for (var j = offset_fix; j < offset - offset_fix; j++) {
      pic.print(font, i, j, package_info.name);
    }
  }
  pic.color([
    { apply: "red", params: [-0xff] },
    { apply: "green", params: [-0xff] }
  ]);

  offset_fix = offset / 2;
  pic.print(font, offset_fix, offset_fix, package_info.name);

  pic.scaleToFit(1060, 300);
  pic.write("./public/img/text2.png");
  console.log("text done");
}
async function gen_no_pic() {
  var font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
  var widht = Jimp.measureText(font, "?");
  var height = Jimp.measureTextHeight(font, "?");
  var text = await Jimp.read("./public/img/text.png");

  var pic = new Jimp(widht, height, 0xffffffff);
  pic.print(font, 0, 0, "?");
  pic.resize(460, 215);
  pic.invert();
  pic.blur(5);

  text.scaleToFit(pic.bitmap.width * 0.9, pic.bitmap.height * 0.9);
  text.fade(0.3);

  pic.composite(
    text,
    (pic.bitmap.width - text.bitmap.width) / 2,
    (pic.bitmap.height - text.bitmap.height) / 2
  );

  pic.write("./public/img/games/no_pic.jpg");
  console.log("no pic done");
}
async function gen_banner() {
  var text = await Jimp.read("./public/img/text.png");
  var pic_size = await Jimp.read("./public/img/games/no_pic.jpg");
  pic_size.scaleToFit(text.bitmap.width / 3, text.bitmap.height / 3);
  var tmp_height = (text.bitmap.height / 3) * 4;
  var tmp_width = 0;
  while (tmp_width < text.bitmap.width) {
    tmp_width += pic_size.bitmap.width;
  }

  var pic = new Jimp(tmp_width, tmp_height, 0x00000000);

  // Getting and Adding Games
  var count_width = 0;
  var count_height = 0;
  var count_games = 0;
  const l = await Link.query()
    .select("name")
    .groupBy("name")
    .orderBy("discount", "DESC");
  console.log("Banner: Game Discounts: ", l.length);

  while (count_height < pic.bitmap.height) {
    while (count_width < pic.bitmap.width) {
      if (count_games >= l.length) {
        if (count_width == 0 && count_height == 0) {
          count_width = pic.bitmap.width;
          count_height = pic.bitmap.height;
        }
        //count_games = 0;
      }
      var path = await Game.query().where("name", l[count_games].name);
      //console.log(l[count_games].name);
      if (path[0] != undefined) {
        //console.log(path[0].banner);
        var gp = await Jimp.read(path[0].banner);
        gp.scaleToFit(pic.bitmap.width, pic.bitmap.height / 4);
        //gp.rotate(-20,false);
        pic.composite(gp, count_width, count_height);
        count_width += gp.bitmap.width;
        if (count_width >= pic.bitmap.width) {
          count_height += gp.bitmap.height;
        }
        //count_games++;
      } else {
        //count_height = pic.bitmap.height;
        //count_width = pic.bitmap.width;
      }
      count_games++;
    }
    count_width = 0;
  }
  pic.grayscale();

  pic.write("./public/img/background.png");
  console.log("background done");

  // Adding Text
  text.scaleToFit(pic.bitmap.width * 0.75, pic.bitmap.height * 0.75);
  pic.composite(
    text,
    (pic.bitmap.width - text.bitmap.width) / 2,
    (pic.bitmap.height - text.bitmap.height) / 2
  );

  pic.write("./public/img/banner.png");
  console.log("banner done");
}
main();
