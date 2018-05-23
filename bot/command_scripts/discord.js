//https://github.com/Istani/SimpleYTHelper/issues
var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  init_discord: function (DBot) {
    discord=DBot;
  },
  init_chatcheck: function(AddHosts, AddUser) {
    UpdateHosts=AddHosts;
    UpdateUser=AddUser;
  },
  check_permission: function (message_row, SendFunc, NewMessageFunc) {
    var permissions=false;
    
    if (message_row.user=="-1") {
      permissions=true;
    }
    
    permissions=true; // Fake Recht!
    
    if (permissions==false) {
      SendFunc(message_row.user+ " du hast keine Rechte den Befehl auszuführen!\r\n" + message_row.message);
    } else {
      self.execute(message_row, SendFunc, NewMessageFunc);
    }
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    var count_server=0;
    var count_user=0;
    var guilds =discord.guilds;
    var msg_guild=null;
    if (message_row.service!="Discord") {
      return;
    }
    for (var [key, guild] of guilds) {
      count_server++;
      if (guild.id==message_row.host) {
        msg_guild=guild;
      }
      UpdateHosts("Discord", guild.id, guild.name, guild.ownerID);
      var members =guild.members;
      for (var [key, member] of members) {
        count_user++;
        var UserRoles=[];
        guild.member(member.user).roles.forEach(function(element){
          UserRoles.push(element.name);
        });
        UpdateUser("Discord", guild.id, member.user.id, member.user.username, UserRoles);
        if (member.user.id==discord.user.id) {
          var has_kick = guild.member(member.user).hasPermission("KICK_MEMBERS");
          if (has_kick) {
            guild.pruneMembers(30).then(pruned => {}).catch(console.error);
          }
        }
      }
    }
    SendFunc("Discord: "+count_server+" Server with "+count_user+" User");
    
  },
};
var mysql=null;
var discord=null;
var UpdateHosts;
var UpdateUser;
