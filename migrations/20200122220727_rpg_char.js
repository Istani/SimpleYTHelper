exports.up = function(knex) {
  return knex.schema.createTable("rpg_char", function(t) {
    t.string("owner", 50);
    t.string("id", 50);
    t.integer("hp", 50).defaultTo(0);
    t.integer("hp_max", 50).defaultTo(0);
    t.integer("atk", 50).defaultTo(0);
    t.integer("threat", 50).defaultTo(0);
    t.primary(["owner", "id"]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("rpg_char");
};
