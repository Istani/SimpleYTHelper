const package_info = require("./package.json");
const Game = require("./models/game.js");
const Link = require("./models/game_link.js");
const Jimp = require("jimp");
const fs = require("fs");

async function main() {
  //await gen_url_text();
  //await gen_no_pic();
  //await details_shadow();
  //await logo_shadow();
  //await logo_details();
  //await logo_text_long();
  await gen_banner();
  /*
  const g = await Game.query()
    .where({ type: "game" })
    .orderBy("updated_at");
  or (var i = 0; i < g.length; i++) {
    await get_image(g[i]);
  }
  */
}
async function gen_url_text() {
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

  pic.scaleToFit(4060, 300);
  pic.write("./public/img/url_text.png");
  console.log("text done");
}
async function gen_no_pic() {
  var font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
  var widht = Jimp.measureText(font, "?");
  var height = Jimp.measureTextHeight(font, "?");
  var text = await Jimp.read("./public/img/url_text.png");

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
async function details_shadow() {
  var offset = 16;

  var details = await Jimp.read("./public/img/logo_details.png");
  details.color([{ apply: "green", params: [0x66] }]);

  var pic = new Jimp(
    details.bitmap.width + offset * 2,
    details.bitmap.height + offset * 2,
    0xffffff00
  );

  var temp_x = (pic.bitmap.width - details.bitmap.width) / 2;
  var temp_y = (pic.bitmap.height - details.bitmap.height) / 2;

  for (let xi = temp_x - offset; xi < temp_x + offset; xi++) {
    for (let yi = temp_y - offset; yi < temp_y + offset; yi++) {
      pic.composite(details, xi, yi);
    }
  }
  pic.color([
    { apply: "blue", params: [-0xff] },
    { apply: "red", params: [-0xff] },
    { apply: "green", params: [-0xff] }
  ]);
  pic.composite(details, temp_x, temp_y);
  pic.scaleToFit(300, 300);
  pic.write("./public/img/tmp_details.png");

  console.log("details done");
}
async function logo_shadow() {
  var offset = 8;

  var details = await Jimp.read("./public/img/logo_pacman.png");
  var pic = new Jimp(
    details.bitmap.width + offset * 2,
    details.bitmap.height + offset * 2,
    0xffffff00
  );

  var temp_x = (pic.bitmap.width - details.bitmap.width) / 2;
  var temp_y = (pic.bitmap.height - details.bitmap.height) / 2;

  for (let xi = temp_x - offset; xi < temp_x + offset; xi++) {
    for (let yi = temp_y - offset; yi < temp_y + offset; yi++) {
      pic.composite(details, xi, yi);
    }
  }
  pic.color([
    { apply: "blue", params: [-0xff] },
    { apply: "red", params: [-0xff] },
    { apply: "green", params: [-0xff] }
  ]);
  pic.composite(details, temp_x, temp_y);
  pic.scaleToFit(300, 300);
  pic.write("./public/img/tmp_pacman.png");

  console.log("pacman done");
}
async function logo_details() {
  var logo = await Jimp.read("./public/img/tmp_pacman.png");
  var details = await Jimp.read("./public/img/tmp_details.png");
  details.scaleToFit(details.bitmap.width / 2, details.bitmap.height / 2);

  var pic = new Jimp(logo.bitmap.width * 3, logo.bitmap.height, 0xffffff00);
  var center_details_x = (logo.bitmap.width - details.bitmap.width) / 2;
  var center_details_y = (logo.bitmap.height - details.bitmap.height) / 2;

  var new_x = center_details_x + logo.bitmap.width / 2;
  pic.composite(details, new_x, center_details_y);
  new_x = new_x + details.bitmap.width;
  pic.composite(details, new_x, center_details_y);
  new_x = new_x + details.bitmap.width;
  pic.composite(details, new_x, center_details_y);
  new_x = new_x + details.bitmap.width;
  pic.composite(details, new_x, center_details_y);

  pic.composite(logo, 0, 0);
  pic.scaleToFit(1060, 300);

  pic.write("./public/img/tmp_logo.png");
  console.log("tmp logo done");
}
async function logo_text_long() {
  var logo = await Jimp.read("./public/img/tmp_logo.png");
  var details = await Jimp.read("./public/img/url_text.png");

  var new_size = logo.bitmap.width + details.bitmap.width;
  var pic = new Jimp(new_size, logo.bitmap.height, 0xffffff00);
  pic.composite(logo, 0, 0);
  pic.composite(details, logo.bitmap.width, 0);
  pic.scaleToFit(728, 90);

  pic.write("./public/img/text.png");
  console.log("tmp text new done");
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
