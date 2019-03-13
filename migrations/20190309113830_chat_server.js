
exports.up = function(knex, Promise) {
  return knex.schema.createTable('chat_server', function(t) {
    //t.increments('id').primary();
    t.string('service');
    t.string('server');
    t.string('name');

    t.timestamps(true, false);
    t.primary(['service', 'server']);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('chat_server');
};
