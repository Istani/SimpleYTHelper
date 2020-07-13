exports.up = function(knex) {
  return knex.schema.createTable("metagamerscore", function(t) {
    t.string("user", 50);
    t.string("game", 50);
    t.string("title", 120);
    t.boolean("is_send").defaultTo(false);

    t.string("publishedAt", 50);

    t.timestamps(false, false);

    t.primary(["user", "game", "title"]);
  });
  //    ---   knex.schema.raw("SET sql_mode='TRADITIONAL'")    ---
  // ALTER TABLE `videos`
  // CHANGE COLUMN `description` `description` TEXT NULL COLLATE 'utf8mb4_unicode_ci' AFTER `commentCount`,
  // CHANGE COLUMN `created_at` `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `description`;
};

exports.down = function(knex) {
  return knex.schema.dropTable("metagamerscore");
};
