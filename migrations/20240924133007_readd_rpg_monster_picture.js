exports.up = function(knex, Promise) {
  return knex.schema.alterTable("rpg_monster", function(t) {
    t.string("picture", 300).defaultTo("");
    // Irgendwie ging das nicht, deswegen manuell geändert!
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable("rpg_monster", function(t) {
    //t.dropColumn("profile_picture");
  });
};
