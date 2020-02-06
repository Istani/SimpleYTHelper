exports.up = function(knex, Promise) {
  return knex.schema.alterTable("channel", function(t) {
    t.string("user_id", 50)
      .notNull()
      .alter();
    t.string("service", 50)
      .notNull()
      .alter();
    t.string("channel_id", 50)
      .notNull()
      .alter();
  });
};

exports.down = function(knex, Promise) {};
