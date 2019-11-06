exports.up = function(knex, Promise) {
  return knex.schema.alterTable("game_genres", function(t) {
    t.string("name", 100)
      .notNull()
      .alter();
  });
};

exports.down = function(knex, Promise) {};
