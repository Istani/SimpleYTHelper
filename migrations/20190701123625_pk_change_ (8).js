exports.up = function(knex, Promise) {
  return knex.schema.alterTable("chat_room", function(t) {
    t.string("service", 50)
      .notNull()
      .alter();
    t.string("server", 50)
      .notNull()
      .alter();
    t.string("room", 50)
      .notNull()
      .alter();
  });
};

exports.down = function(knex, Promise) {};
