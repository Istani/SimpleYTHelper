var self = module.exports = {
  execute: function (msg) {
    var parameter2="";
    var tmp_para=msg.content.split(" ");
    for (var i = 1; i<tmp_para.length;i++) {
      parameter2=parameter2+ " " +tmp_para[i];
    }
    parameter2 = parameter2.trim();
    parameter2 = msg.author.username + " ruft: "+parameter2;
    msg.channel.sendTTSMessage(parameter2);
    msg.delete();
  }
};
