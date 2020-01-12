const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Channel extends Model {
  static get tableName() {
    return "channel";
  }
  static get idColumn() {
    return "user_id, service, channel_id";
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  static get relationMappings() {
    const Livestream = require("./broadcast.js");

    return {
      Livestream: {
        relation: Model.HasManyRelation,
        modelClass: Livestream,
        join: {
          from: "channel.channel_id",
          to: "broadcasts.owner"
        }
      }
    };
  }
}

module.exports = Channel;
