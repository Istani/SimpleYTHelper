const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Token extends Model {
  static get tableName() {
    return "syth_token";
  }
  static get idColumn() {
    return "id";
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  static get relationMappings() {
    const Channel = require("./channel.js");

    return {
      channel: {
        relation: Model.HasManyRelation,
        modelClass: Channel,
        join: {
          from: "channel.channel_id",
          to: "syth_token.service_user"
        }
      }
    };
  }
}

module.exports = Token;
