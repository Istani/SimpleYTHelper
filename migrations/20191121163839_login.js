exports.up = function(knex) {
  return knex.schema.createTable("syth_login", function(t) {
    t.increments("id");
    t.string("user", 50).notNull();
    t.string("pass", 250).notNull();
    t.boolean("is_admin").defaultTo(false);
    t.boolean("is_bot").defaultTo(false);
    t.boolean("is_newsletter").defaultTo(false);
    t.string("activation_code", 250).notNull();
    t.timestamps(true, false);
  });
};

exports.down = function(knex) {};
