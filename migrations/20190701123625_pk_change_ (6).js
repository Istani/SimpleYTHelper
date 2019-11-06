exports.up = function(knex, Promise) {
  return knex.schema.alterTable("game_merch", function(t) {
    t.string("store", 50)
      .notNull()
      .alter();
    //t.string('name', 200).notNull().alter();
    t.string("product", 50)
      .notNull()
      .alter();
  });
};

exports.down = function(knex, Promise) {};
