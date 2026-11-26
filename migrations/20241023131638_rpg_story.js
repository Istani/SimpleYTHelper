// Reconstructed from the applied production schema.
exports.up = function(knex) {
  return knex.schema.createTable("rpg_story", function(t) {
    t.string("owner", 50).notNull();
    t.string("id", 50).notNull();
    t.string("user", 255).nullable();
    t.string("type", 255).nullable();
    t.string("message", 255).nullable();
    t.timestamps(true, false);
    t.primary(["owner", "id"]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("rpg_story");
};
