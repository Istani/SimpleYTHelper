const game = require('./models/game.js');

var name = "1__2__3__4__5__6__7__8__9__0___";
while (name.length < 500) {
  name = name + name;
}
console.log(name, game.getEncodedName(name));