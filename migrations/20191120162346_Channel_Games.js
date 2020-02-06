exports.up = function(knex) {
  return knex.schema.alterTable("chat_room", function(t) {
    //t.dropPrimary();
    t.string("linked_game", 100);
  });
};

exports.down = function(knex) {};
