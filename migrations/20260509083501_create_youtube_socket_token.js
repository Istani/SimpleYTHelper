exports.up = function(knex) {
  return knex.schema.createTable("youtube_socket_token", function(t) {
    t.increments("id");
    t.integer("user_id");
    t.string("client_id");
    t.string("client_secret");
    t.string("redirect_url");
    t.text("access_token");
    t.string("refresh_token");
    t.string("scope");
    t.string("token_type");
    t.string("expiry_date");
    t.string("service_user");
    t.boolean("is_importing").defaultTo(false);
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("youtube_socket_token");
};
