exports.up = function(knex) {
  return knex.schema.createTable("syth_token", function(t) {
    t.increments("id");
    t.integer("user_id").notNull();
    t.string("service", 50).notNull();
    t.string("access_token", 250);
    t.string("refresh_token", 250);
    t.string("scope", 250);
    t.string("token_type", 250);
    t.integer("expiry_date", 250);

    t.timestamps(true, false);
  });
};

exports.down = function(knex) {};
