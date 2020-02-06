exports.up = function(knex, Promise) {
  return knex.schema.createTable("send_tweet", function(t) {
    t.increments("id");
    t.string("user");
    t.string("message");

    t.timestamps(true, false);
    //t.primary(['id']);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("send_tweet");
};
