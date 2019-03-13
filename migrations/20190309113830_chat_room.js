
exports.up = function(knex, Promise) {
  return knex.schema.createTable('chat_room', function(t) {
    //t.increments('id').primary();
    t.string('service');
    t.string('server');
    t.string('room');
    t.string('name');

    t.timestamps(true, false);
    t.primary(['service', 'server', 'room']);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('chat_room');
};
