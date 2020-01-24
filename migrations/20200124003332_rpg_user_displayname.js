exports.up = function(knex, Promise) {
  return knex.schema.alterTable("rpg_char", function(t) {
    t.string("displayname").defaultTo("");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("rpg_char");
};
