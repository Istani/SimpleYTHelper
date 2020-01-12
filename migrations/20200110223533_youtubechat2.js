exports.up = function(knex, Promise) {
  return knex.schema.alterTable("chat_message", function(t) {
    t.string("id", 180).alter();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("chat_message");
};
