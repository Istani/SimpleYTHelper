exports.up = function(knex) {
  return knex.schema.alterTable("channel", function(t) {
    t.integer("analytics_views");
    t.integer("analytics_comments");
    t.integer("analytics_likes");
    t.integer("analytics_dislikes");
    t.integer("analytics_estimatedMinutesWatched");
    t.integer("analytics_averageViewDuration");
    t.float("analytics_averageViewPercentage");
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("channel", function(t) {
    t.dropColumn("analytics_views");
    t.dropColumn("analytics_comments");
    t.dropColumn("analytics_likes");
    t.dropColumn("analytics_dislikes");
    t.dropColumn("analytics_estimatedMinutesWatched");
    t.dropColumn("analytics_averageViewDuration");
    t.dropColumn("analytics_averageViewPercentage");
  });
};
