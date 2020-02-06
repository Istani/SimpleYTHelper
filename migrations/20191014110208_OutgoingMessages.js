exports.up = function(knex, Promise) {
  return knex.schema.createTable("outgoing_messages", function(t) {
    t.string("service", 50);
    t.string("server", 50);
    t.string("room", 50);
    t.string("content");

    t.timestamps(true, false);
    t.primary(["service", "server", "room", "created_at"]);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("outgoing_messages");
};
