exports.up = function(knex) {
  return knex.schema.createTable("videos", function(t) {
    t.string("service", 50);
    t.string("owner", 50);
    t.string("v_id", 50);
    t.string("thumbnail", 50);
    t.string("title");
    t.string("privacyStatus", 50);
    t.string("publishedAt", 50);
    t.integer("viewCount");
    t.integer("likeCount");
    t.integer("dislikeCount");
    t.integer("commentCount");
    t.text("description");

    t.timestamps(false, false);

    t.primary(["service", "owner", "v_id"]);
  });
  //    ---   knex.schema.raw("SET sql_mode='TRADITIONAL'")    ---
  // ALTER TABLE `videos`
  // CHANGE COLUMN `description` `description` TEXT NULL COLLATE 'utf8mb4_unicode_ci' AFTER `commentCount`,
  // CHANGE COLUMN `created_at` `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `description`;
};

exports.down = function(knex) {
  return knex.schema.dropTable("videos");
};
