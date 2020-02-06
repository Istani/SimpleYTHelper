exports.up = function(knex, Promise) {
  return knex.schema.alterTable("chat_user", function(t) {
    t.string("service", 50)
      .notNull()
      .alter();
    t.string("server", 50)
      .notNull()
      .alter();
    t.string("user", 50)
      .notNull()
      .alter();
  });
};

exports.down = function(knex, Promise) {};
