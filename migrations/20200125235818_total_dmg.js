exports.up = function(knex, Promise) {
  return knex.schema.alterTable("rpg_char", function(t) {
    t.string("total_dmg").defaultTo(0);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("rpg_char");
};
