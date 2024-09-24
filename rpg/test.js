const Server = require("./models/chat_server.js");
const Messages = require("./models/chat_message.js");
const User_Channel = require("./models/channel.js");
const Login = require("./models/syth_login.js");

async function test_func() {
  /*
  var data = await User_Channel.query().where("user_id", 1).eager("VIPs");

  console.log(data);
  */

  var msg_list = await Messages.query()
    //.where("content", "like", "?%")
    .where("created_at", ">", 0)
    .where("service", "like", "discord")
    .orderBy("created_at");

  for (var i = 0; i < msg_list.length; i++) {
    var user = await getSythUser(msg_list[i]);
  }
}
test_func();

async function getSythUser(msg) {
  var ret = 1;
  var ls = await Login.query()
    .limit(1)
    .orderBy("id");
  if (ls.length == 0) return ret;
  ret = ls[0].id;

  var server_list = await Server.query()
    .where("server", "like", msg.server)
    .where("service", "like", msg.service)
    .orderBy("created_at");

  if (server_list.length == 0) return ret;
  if (server_list[0].owner == null) return ret;

  var channel_list = await User_Channel.query().where(
    "channel_id",
    server_list[0].owner
  );
  if (channel_list.length == 0) return ret;

  ret = channel_list[0].user_id;
  return ret;
}
