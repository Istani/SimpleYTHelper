var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  init_discord: function (DBot) {
    discord=DBot;
  },
  check_permission: function (message_row, SendFunc, NewMessageFunc) {
    var permissions=false;
    
    if (message_row.user=="-1") {
      permissions=true;
    }
    
    if (permissions==false) {
      SendFunc(message_row.user+ " du hast keine Rechte den Befehl auszuführen!\r\n" + message_row.message);
    } else {
      self.execute(message_row, SendFunc, NewMessageFunc);
    }
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    var all_guilds=discord.guilds;
    var this_guild=null;
    
    for (var [key, guild] of all_guilds) {
      if (guild.id==message_row.host) {
        this_guild=guild;
      }
    }
    if (this_guild==null) {
      return;
    }
    
    var all_roles=this_guild.roles;
    for (var [key, role] of all_roles) {
      console.log(role);
      return;
    }
    
    var members =guild.members;
    for (var [key, member] of members) {
      count_user++;
      var UserRoles=[];
      guild.member(member.user).roles.forEach(function(element){
        UserRoles.push(element.name);
      });
    }
  }
};
var mysql=null;
