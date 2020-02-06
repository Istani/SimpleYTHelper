exports.up = function(knex, Promise) {
  return knex.schema.createTable("chat_message", function(t) {
    //t.increments('id').primary();
    t.string("service", 50);
    t.string("server", 50);
    t.string("room", 50);
    t.string("user");
    t.string("id", 50);
    t.datetime("timestamp");
    t.string("content");

    t.timestamps(true, false);
    t.primary(["service", "server", "room", "id"]);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("chat_message");
};
