
exports.up = function(knex, Promise) {
  return knex.schema.createTable('chat_user', function(t) {
    //t.increments('id').primary();
    t.string('service');
    t.string('server');
    t.string('user');
    t.string('name');

    t.timestamps(false, true);
    t.primary(['service', 'server', 'user']);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('chat_user');
};
