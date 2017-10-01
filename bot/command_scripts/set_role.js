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
    var user=message_row.message.split(" ").slice(1).join(" ").split(":")[0];
    var role=message_row.message.split(":").slice(1).join(" ");
    
    // Zum Test;
    role="RPG_MVP";
    
    if (message_row.service!="Discord") {
      SendFunc("Leider nur fuer Discord Verfügbar!")
    }
    // Suche Gilde
    for (var [key, guild] of all_guilds) {
      if (guild.id==message_row.host) {
        this_guild=guild;
      }
    }
    if (this_guild==null) {
      SendFunc("Gilde nicht gefunden!");
      return;
    }
    
    // Suche Role
    var all_roles=this_guild.roles;
    var the_role=null;
    for (var [key, role] of all_roles) {
      if (role.name==role) {
        the_role=role;
      }
    }
    if (the_role==null) {
      SendFunc("Rolle: "+role+" nicht gefunden!");
      return;
    }
    
    // Suche User
    var all_member=this_guild.members;
    var this_member=null;
    for (var [key, member] of members) {
      if (member.name==user) {
        this_member=member;
      }
    }
    if (this_member==null) {
      SendFunc("User: "+user+" nicht gefunden!");
      return;
    }
    
    this_member.addRole(the_role).catch(console.error);
    SendFunc("User: "+user+" wurde zum "+role+"!");
    
    
  }
};
var mysql=null;
