exports.up = function(knex, Promise) {
  return knex.schema.createTable("game_overview", function(t) {
    t.string("type").notNull();
    t.string("name", 50)
      .notNull()
      .primary();
    t.string("display_name").notNull();
    t.string("banner").notNull();
    t.text("description").notNull();
    t.timestamps(true, false);
  });
};

exports.down = function(knex, Promise) {};
