exports.up = function(knex, Promise) {
  return knex.schema.alterTable("rpg_monster", function(t) {
    t.integer("hp_cap", 50).defaultTo(0);
    t.integer("dmg_cap", 50).defaultTo(0);
    t.string("death_cooldown").defaultTo(0);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("rpg_monster");
};
