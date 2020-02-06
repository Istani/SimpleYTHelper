exports.up = function(knex, Promise) {
  return knex.schema.alterTable("simpleyth_oauth_botcredentials", function(t) {
    t.string("service", 50)
      .notNull()
      .alter();
  });
};

exports.down = function(knex, Promise) {};
