exports.up = function(knex, Promise) {
  return knex.schema.alterTable("rpg_char", function(t) {
    t.integer("total_dmg")
      .defaultTo(0)
      .alter();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("rpg_char");
};
