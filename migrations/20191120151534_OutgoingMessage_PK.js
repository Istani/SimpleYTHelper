exports.up = function(knex) {
  return knex.schema.alterTable("outgoing_messages", function(t) {
    //t.dropPrimary();
    t.increments("id");
  });
};

exports.down = function(knex) {};
