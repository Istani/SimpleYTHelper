exports.up = function(knex, Promise) {
  return knex.schema.createTable("simpleyth_login_token", function(t) {
    t.increments("id").primary();
    t.string("service").notNull();
    t.string("user").notNull();
    t.string("access_token").notNull();
    t.string("refresh_token").notNull();
    t.boolean("cronjob").notNull();
    t.timestamps(true, false);
  });
};

exports.down = function(knex, Promise) {};
