var self = module.exports = {
  execute: function (message_row, SendFunc, NewMessageFunc) {
    if (message_row.service=="Discord") {
      NewMessageFunc("Discord TTS", message_row.host, message_row.room, message_row.id, message_row.time, message_row.user, message_row.message);
      return;
    }
    var amount=0;
    var tmp_para=message_row.message.split(" ");
    if (typeof tmp_para[1]=='undefined') {
      amount=1;
    } else {
      if (parseInt(tmp_para[1])>0) {
        amount=parseInt(tmp_para[1]);
      }
    }
    while (amount>0) {
      setTimeout(function () {SendFunc("PARTY @everyone");}, 1000*amount);
      amount=amount-1;
    }
  }
};
