exports.up = function(knex, Promise) {
  return knex.schema.alterTable("outgoing_messages", function(t) {
    t.string("room", 75).alter();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("outgoing_messages");
};
