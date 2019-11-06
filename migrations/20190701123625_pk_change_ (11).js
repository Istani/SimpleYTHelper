exports.up = function(knex, Promise) {
  return knex.schema.alterTable("game_check", function(t) {
    t.string("category", 20)
      .notNull()
      .alter();
    //t.string('game', 200).notNull().alter();
  });
};

exports.down = function(knex, Promise) {};
