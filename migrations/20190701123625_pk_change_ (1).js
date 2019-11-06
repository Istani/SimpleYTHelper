exports.up = function(knex, Promise) {
  return knex.schema.alterTable("simpleyth_oauth_secrets", function(t) {
    t.string("service", 50)
      .notNull()
      .alter();
  });
};

exports.down = function(knex, Promise) {};
