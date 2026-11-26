/**
 * The channel table originally modeled YouTube metadata as mandatory.
 * Twitch and Discord do not provide every one of those values, so optional
 * cross-service metadata must be representable without importer workarounds.
 */
exports.up = async function(knex) {
  await knex.schema.alterTable("channel", function(t) {
    t.text("description")
      .nullable()
      .alter();
    t.datetime("start_date")
      .nullable()
      .alter();
    t.string("thumbnail")
      .nullable()
      .alter();
    t.string("banner")
      .nullable()
      .alter();
    t.string("main_playlist")
      .nullable()
      .defaultTo(null)
      .alter();
    t.integer("views")
      .notNullable()
      .defaultTo(0)
      .alter();
    t.integer("subscriber")
      .notNullable()
      .defaultTo(0)
      .alter();
    t.integer("videos")
      .notNullable()
      .defaultTo(0)
      .alter();
  });

  // A playlist is a YouTube-only concept; normalize prior non-YouTube rows.
  await knex("channel")
    .whereIn("service", ["twitch", "discord"])
    .update({ main_playlist: null });
};

exports.down = async function(knex) {
  await knex.schema.alterTable("channel", function(t) {
    t.string("main_playlist")
      .nullable()
      .defaultTo(null)
      .alter();
    t.integer("views")
      .notNullable()
      .alter();
    t.integer("subscriber")
      .notNullable()
      .alter();
    t.integer("videos")
      .notNullable()
      .alter();
  });
};
