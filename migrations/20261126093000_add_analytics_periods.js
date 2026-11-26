exports.up = function(knex) {
  return knex.schema
    .table("channel_analytics_history", function(t) {
      t.date("period_start")
        .nullable()
        .after("channel_id");
      t.date("period_end")
        .nullable()
        .after("period_start");
    })
    .table("video_analytics_history", function(t) {
      t.date("period_start")
        .nullable()
        .after("video_id");
      t.date("period_end")
        .nullable()
        .after("period_start");
    });
};
exports.down = function(knex) {
  return knex.schema
    .table("video_analytics_history", function(t) {
      t.dropColumn("period_end");
      t.dropColumn("period_start");
    })
    .table("channel_analytics_history", function(t) {
      t.dropColumn("period_end");
      t.dropColumn("period_start");
    });
};
