exports.up = function(knex, Promise) {
  return knex.schema.createTable("game_check", function(t) {
    t.string("category", 50);
    t.string("game", 50);
    t.string("link");
    t.integer("discount").defaultTo(0);
    t.string("display_title");
    t.string("display_text");

    t.timestamps(true, false);
    t.primary(["category", "game"]);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("game_check");
};
