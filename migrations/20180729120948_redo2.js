
exports.up = function (knex, Promise) {
  return knex.schema.createTable('simpleyth_oauth_secrets', function (t) {
    t.string('service').notNull().primary();
    t.string('client_id').notNull();
    t.string('client_secret').notNull();
    t.string('url_authorize').notNull();
    t.string('url_token').notNull();
    t.string('app_scope').notNull();
    t.timestamps(true, true);
  });
};

exports.down = function(knex, Promise) {
  
};
