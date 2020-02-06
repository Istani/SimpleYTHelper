exports.up = function(knex, Promise) {
  return knex.schema.alterTable("game_merch", function(t) {
    t.string("store", 20)
      .notNull()
      .alter();
    t.string("name", 100)
      .notNull()
      .alter();
    t.string("product", 20)
      .notNull()
      .alter();
  });
};

exports.down = function(knex, Promise) {};
