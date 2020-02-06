exports.up = function(knex, Promise) {
  return knex.schema.createTable("game_link", function(t) {
    t.string("store", 50).notNull();
    t.string("name", 50).notNull();
    t.string("link").notNull();
    t.integer("price")
      .notNull()
      .defaultTo(0);
    t.integer("discount")
      .notNull()
      .defaultTo(0);
    t.timestamps(true, false);

    t.primary(["store", "name"]);
  });
};

exports.down = function(knex, Promise) {};
