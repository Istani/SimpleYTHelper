exports.up = function(knex, Promise) {
  return knex.schema.alterTable("rpg_monster", function(t) {
    t.dropColumn("picture");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable("rpg_monster", function(t) {
    //t.dropColumn("profile_picture");
  });
};
