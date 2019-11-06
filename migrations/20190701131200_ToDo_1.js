exports.up = function(knex, Promise) {
  return knex.schema.alterTable("game_check", function(t) {
    t.string("game", 100)
      .notNull()
      .alter();
  });
};

exports.down = function(knex, Promise) {};
