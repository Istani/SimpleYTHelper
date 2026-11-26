// Reconstructed from the applied production schema. The table name contains
// the historic `itmes` typo and must remain unchanged for compatibility.
exports.up = function(knex) {
  return knex.schema.createTable("rpg_itmes", function(t) {
    t.string("icon", 50).notNull();
    t.string("name", 50)
      .notNull()
      .primary();
    t.integer("heal")
      .notNull()
      .defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("rpg_itmes");
};
