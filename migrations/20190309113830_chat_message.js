
exports.up = function(knex, Promise) {
  return knex.schema.createTable('chat_message', function(t) {
    //t.increments('id').primary();
    t.string('service');
    t.string('server');
    t.string('room');
    t.string('user');
    t.string('id');
    t.datetime('timestamp');
    t.string('content');
    
    t.timestamps(false, true);
    t.primary(['service', 'server', 'room', 'id']);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('chat_message');
};
