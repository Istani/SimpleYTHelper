exports.up = function(knex, Promise) {
  return knex.schema.alterTable("chat_message", function(t) {
    t.string("room", 75).alter();
    t.string("id", 161).alter();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("chat_message");
};
