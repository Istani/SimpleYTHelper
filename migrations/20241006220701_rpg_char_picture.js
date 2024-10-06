exports.up = function(knex, Promise) {
  return knex.schema.alterTable("rpg_char", function(t) {
    t.string("picture", 300).defaultTo("");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable("rpg_char", function(t) {
    t.dropColumn("picture");
  });
};
