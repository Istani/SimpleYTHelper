exports.up = function(knex) {
  return knex.schema.createTable("live_chat_event", function(t) {
    t.bigIncrements("id");
    t.string("service", 50).notNullable();
    t.string("channel_id", 100).notNullable();
    t.string("room_id", 150).notNullable();
    t.string("source_event_id", 255).notNullable();
    t.string("type", 50).notNullable();
    t.timestamp("published_at").nullable();
    t.string("author_id", 100).nullable();
    t.string("author_handle", 255).nullable();
    t.string("author_display_name", 255).nullable();
    t.boolean("author_is_owner").nullable();
    t.boolean("author_is_moderator").nullable();
    t.boolean("author_is_member").nullable();
    t.text("text").nullable();
    t.json("details").nullable();
    t.timestamps(true, true);
    t.unique(["service", "channel_id", "room_id", "source_event_id"]);
    t.index(["channel_id", "id"]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("live_chat_event");
};
