exports.up = function(knex) {
  return knex.schema.dropTable("simpleyth_login_token");
};
exports.down = function(knex) {};
