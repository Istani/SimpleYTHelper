exports.up = function(knex) {
  return knex.schema.dropTable("simpleyth_oauth_botcredentials");
};
exports.down = function(knex) {};
