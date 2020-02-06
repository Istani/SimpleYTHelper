exports.up = function(knex) {
  return knex.schema.dropTable("simpleyth_oauth_secrets");
};
exports.down = function(knex) {};
