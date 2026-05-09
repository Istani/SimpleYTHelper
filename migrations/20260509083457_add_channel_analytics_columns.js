exports.up = function(knex) {
  return knex.schema.alterTable("channel", function(t) {
    t.integer("subscribersGained");
    t.integer("subscribersLost");
    t.float("grossRevenue");
    t.float("estimatedRevenue");
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("channel", function(t) {
    t.dropColumn("subscribersGained");
    t.dropColumn("subscribersLost");
    t.dropColumn("grossRevenue");
    t.dropColumn("estimatedRevenue");
  });
};
