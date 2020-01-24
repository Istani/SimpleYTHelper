exports.up = function(knex, Promise) {
  return knex.schema.alterTable("rpg_monster", function(t) {
    t.integer("counter_attacks").defaultTo(0);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("rpg_monster");
};
