exports.up = function(knex) {
  return knex.schema.alterTable("videos", function(t) {
    t.integer("estimatedMinutesWatched");
    t.integer("averageViewDuration");
    t.float("averageViewPercentage");
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("videos", function(t) {
    t.dropColumn("estimatedMinutesWatched");
    t.dropColumn("averageViewDuration");
    t.dropColumn("averageViewPercentage");
  });
};
