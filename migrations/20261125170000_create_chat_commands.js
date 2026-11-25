exports.up = function(knex) {
  return knex.schema
    .createTable("chat_command", function(t) {
      t.increments("id").primary();
      // owner_key keeps global names unique as well; MySQL unique indexes allow multiple NULLs.
      t.string("owner_key", 64).notNull(); // "global" or "user:<syth_login.id>"
      t.integer("owner_id")
        .unsigned()
        .nullable();
      t.string("name", 32).notNull();
      t.string("type", 32)
        .notNull()
        .defaultTo("template");
      t.string("action_key", 64).nullable();
      t.text("response_template").nullable();
      t.string("description", 255)
        .notNull()
        .defaultTo("");
      t.boolean("visible")
        .notNull()
        .defaultTo(true);
      t.boolean("enabled")
        .notNull()
        .defaultTo(true);
      t.integer("global_cooldown_seconds")
        .unsigned()
        .notNull()
        .defaultTo(0);
      t.integer("user_cooldown_seconds")
        .unsigned()
        .notNull()
        .defaultTo(0);
      t.timestamps(true, false);
      t.unique(["owner_key", "name"]);
      t.index(["owner_id", "name"]);
      t.index(["enabled", "owner_id"]);
    })
    .createTable("chat_command_endpoint", function(t) {
      t.string("service", 50).notNull();
      // Discord uses the Guild ID; Twitch uses the channel/room ID; YouTube uses the channel/server ID.
      t.string("endpoint_id", 100).notNull();
      t.integer("owner_id")
        .unsigned()
        .notNull();
      t.string("prefix", 10)
        .notNull()
        .defaultTo("!");
      t.boolean("commands_enabled")
        .notNull()
        .defaultTo(true);
      t.timestamps(true, false);
      t.primary(["service", "endpoint_id"]);
      t.index(["owner_id"]);
    })
    .createTable("chat_command_cooldown", function(t) {
      t.increments("id").primary();
      t.integer("command_id")
        .unsigned()
        .notNull();
      t.string("scope", 16).notNull();
      t.string("chat_user_id", 50).nullable();
      t.datetime("available_at").notNull();
      t.timestamps(true, false);
      t.unique(["command_id", "scope", "chat_user_id"]);
      t.index(["command_id", "available_at"]);
    })
    .createTable("chat_command_audit", function(t) {
      t.increments("id").primary();
      t.integer("command_id")
        .unsigned()
        .nullable();
      t.integer("owner_id")
        .unsigned()
        .nullable();
      t.string("service", 50).nullable();
      t.string("server", 50).nullable();
      t.string("room", 50).nullable();
      t.string("actor_id", 50).nullable();
      t.string("event_type", 64).notNull();
      t.text("metadata").nullable();
      t.timestamps(true, false);
      t.index(["command_id", "created_at"]);
      t.index(["owner_id", "created_at"]);
    })
    .createTable("syth_discord_guild", function(t) {
      t.string("guild_id", 50).primary();
      t.string("guild_name", 150)
        .notNull()
        .defaultTo("");
      t.string("guild_icon", 100).nullable();
      t.boolean("owner_at_link")
        .notNull()
        .defaultTo(false);
      t.boolean("admin_at_link")
        .notNull()
        .defaultTo(false);
      t.datetime("authorization_checked_at").nullable();
      t.integer("owner_id")
        .unsigned()
        .notNull();
      t.string("linked_by_discord_user_id", 50).notNull();
      t.timestamps(true, false);
      t.index(["owner_id"]);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists("syth_discord_guild")
    .dropTableIfExists("chat_command_audit")
    .dropTableIfExists("chat_command_cooldown")
    .dropTableIfExists("chat_command_endpoint")
    .dropTableIfExists("chat_command");
};
