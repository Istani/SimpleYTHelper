exports.up = function(knex, Promise) {
  return knex.schema.createTable("chat_user", function(t) {
    //t.increments('id').primary();
    t.string("service", 50);
    t.string("server", 50);
    t.string("user", 50);
    t.string("name");

    t.timestamps(true, false);
    t.primary(["service", "server", "user"]);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("chat_user");
};
