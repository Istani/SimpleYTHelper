exports.up = function(knex, Promise) {
  return knex.schema.alterTable("rpg_char", function(t) {
    t.string("cooldown").defaultTo(0);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("rpg_char");
};
