
exports.up = function (knex, Promise) {
  return knex.schema.createTable('simpleyth_oauth_botcredentials', function (t) {
    t.string('service').notNull().primary();
    t.string('user_token').notNull();
    t.string('login').notNull();
    t.string('password').notNull();
    t.string('access_token').notNull();
    t.string('refresh_token').notNull();
    t.integer('expires_in').notNull().defaultTo(0);
    t.integer('created').notNull().defaultTo(0);
    t.timestamps(false, true);
  });
};

exports.down = function(knex, Promise) {
  
};
