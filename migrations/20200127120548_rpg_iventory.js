exports.up = function(knex) {
  return knex.schema.createTable("rpg_inventory", function(t) {
    t.increments("id");
    t.string("owner", 50);
    t.string("char_id", 50);
    t.string("item_name", 50);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("rpg_inventory");
};
