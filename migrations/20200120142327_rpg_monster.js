exports.up = function(knex) {
  return knex.schema.createTable("rpg_monster", function(t) {
    t.string("owner", 50);
    t.string("name", 50);
    t.string("picture", 100);
    t.integer("hp", 50);
    t.integer("hp_max", 50);
    t.integer("atk", 50);
    t.primary(["owner"]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("rpg_monster");
};
