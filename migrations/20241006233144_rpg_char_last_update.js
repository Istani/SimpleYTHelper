exports.up = function(knex, Promise) {
  return knex.schema.alterTable("rpg_char", function(t) {
    t.timestamps(true, false);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable("rpg_char", function(t) {
    t.timestamps(false, false);
  });
};
