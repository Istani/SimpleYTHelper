exports.up = function(knex, Promise) {
  return knex.schema.createTable("game_genres", function(t) {
    t.string("name", 50).notNull();
    t.string("genre", 50).notNull();
    t.timestamps(true, false);
    t.primary(["name", "genre"]);
  });
};

exports.down = function(knex, Promise) {};
