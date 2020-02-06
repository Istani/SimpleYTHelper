exports.up = function(knex, Promise) {
  return knex.schema.createTable("simpleyth_login", function(t) {
    t.string("email", 50)
      .notNull()
      .primary();
    t.string("password").notNull();
    t.timestamps(true, false);
    t.string("activation_code").notNull();
    t.integer("login_count")
      .notNull()
      .defaultTo(0);
    t.integer("login_fail")
      .notNull()
      .defaultTo(0);
    t.boolean("newsletter");
  });
};

exports.down = function(knex, Promise) {};
