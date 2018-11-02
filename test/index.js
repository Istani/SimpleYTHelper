var img_path="https://steamcdn-a.akamaihd.net/steam/apps/742120/header.jpg?t=1536077216";

var Jimp = require('jimp');
Jimp.read(img_path)
  .then(img => {
    return img
      .resize(256, 256) // resize
      .quality(100) // set JPEG quality
      //.greyscale() // set greyscale
      .write('test.jpg'); // save
  })
  .catch(err => {
    console.error(err);
  });


new Jimp(512, 150, 0xff0000ff, (err, image) => {
  image.quality(100);
  Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(font => {
    image.print(font, 10, 10, 'Anime Chat');
  });
  image.write('banner.png');
});
