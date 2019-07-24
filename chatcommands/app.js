process.chdir(__dirname);
const package_info = require('./package.json');
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

// DB-Models
const Messages = require("./models/chat_message.js");
const Rooms = require("./models/chat_room.js");
const Server = require("./models/chat_server.js");

var prefix='1';
var last_time=0;//new Date().toISOString();
// 444392697722175498 - #angebote

async function get_msg() {
  console.log(prefix, last_time);
  var msg_list = await Messages.query().where('content','like',prefix+'%').where('created_at','>',last_time);
  console.log(msg_list);
  
  setTimeout(get_msg,5000);
}
get_msg();
