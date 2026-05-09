exports.up = function(knex) {
  return knex.schema
    .createTable("channel_analytics_history", function(t) {
      t.increments("id");
      t.string("service", 50);
      t.string("channel_id", 50);
      t.integer("views");
      t.integer("comments");
      t.integer("likes");
      t.integer("dislikes");
      t.integer("estimatedMinutesWatched");
      t.integer("averageViewDuration");
      t.float("averageViewPercentage");
      t.integer("subscribersGained");
      t.integer("subscribersLost");
      t.float("grossRevenue");
      t.float("estimatedRevenue");
      t.timestamp("timestamp").defaultTo(knex.fn.now());
      t.index(["service", "channel_id", "timestamp"]);
    })
    .createTable("video_analytics_history", function(t) {
      t.increments("id");
      t.string("service", 50);
      t.string("channel_id", 50);
      t.string("video_id", 50);
      t.integer("views");
      t.integer("comments");
      t.integer("likes");
      t.integer("dislikes");
      t.integer("estimatedMinutesWatched");
      t.integer("averageViewDuration");
      t.float("averageViewPercentage");
      t.timestamp("timestamp").defaultTo(knex.fn.now());
      t.index(["service", "video_id", "timestamp"]);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable("video_analytics_history")
    .dropTable("channel_analytics_history");
};
