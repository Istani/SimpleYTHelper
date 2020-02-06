exports.up = function(knex, Promise) {
  return knex.schema.createTable("short_url", function(t) {
    t.string("code", 50);
    t.string("url");
    t.integer("user").defaultTo(0);

    t.timestamps(true, false);
    t.primary(["code"]);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("short_url");
};
