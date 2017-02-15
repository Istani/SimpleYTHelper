var self = module.exports = {
  execute: function (message_row, SendFunc, NewMessageFunc) {
    var IstaniUserID='202892723420659714';
    if (message_row.user==IstaniUserID) { // TODO: Implement Permissions
      SendFunc("Shutdown - Trying Reboot!");
      setTimeout(function () {
        process.exit();
      }, 5000);
    } else {
      SendFunc("No Permissions! " + message_row.user);
    }
  },
};
