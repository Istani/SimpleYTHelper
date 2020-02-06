exports.up = function(knex, Promise) {
  return knex.schema.alterTable("chat_room", function(t) {
    t.string("room", 75).alter();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("chat_room");
};
