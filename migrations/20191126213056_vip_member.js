exports.up = function(knex) {
  return knex.schema.createTable("vip_member", function(t) {
    t.string("service", 50);
    t.string("owner", 50);
    t.string("member_id", 50);
    t.string("member_name", 50);
    t.timestamp("since");

    t.timestamps(true, false);

    t.primary(["service", "owner", "member_id"]);
  });
};

exports.down = function(knex) {};
