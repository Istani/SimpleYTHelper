exports.up = function(knex) {
  return knex.schema
    .alterTable("syth_login", function(t) {
      t.boolean("is_api_admin")
        .notNullable()
        .defaultTo(false);
    })
    .createTable("syth_api_key", function(t) {
      t.increments("id");
      t.integer("owner_id")
        .notNullable()
        .index();
      t.string("label", 100).notNullable();
      t.string("key_prefix", 24)
        .notNullable()
        .index();
      t.string("key_hash", 64)
        .notNullable()
        .unique();
      t.timestamp("last_used_at").nullable();
      t.timestamp("revoked_at").nullable();
      t.timestamps(true, true);
    })
    .createTable("syth_api_usage", function(t) {
      t.bigIncrements("id");
      t.integer("api_key_id")
        .notNullable()
        .index();
      t.integer("owner_id")
        .notNullable()
        .index();
      t.integer("requested_user_id")
        .notNullable()
        .index();
      t.string("method", 10).notNullable();
      t.string("endpoint", 255).notNullable();
      t.integer("response_status").notNullable();
      t.integer("duration_ms").notNullable();
      t.integer("response_bytes")
        .notNullable()
        .defaultTo(0);
      t.boolean("is_admin_request")
        .notNullable()
        .defaultTo(false);
      t.timestamp("created_at")
        .notNullable()
        .defaultTo(knex.fn.now());
      t.index(["owner_id", "created_at"]);
      t.index(["api_key_id", "created_at"]);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable("syth_api_usage")
    .dropTable("syth_api_key")
    .alterTable("syth_login", function(t) {
      t.dropColumn("is_api_admin");
    });
};
