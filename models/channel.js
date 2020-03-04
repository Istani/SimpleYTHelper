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
    const Videos = require("./videos.js");
    const Livestream = require("./broadcast.js");
    const VIPs = require("./member.js");

    return {
      Videos: {
        relation: Model.HasManyRelation,
        modelClass: Videos,
        join: {
          from: "channel.channel_id",
          to: "videos.owner"
        }
      },
      Livestream: {
        relation: Model.HasManyRelation,
        modelClass: Livestream,
        join: {
          from: "channel.channel_id",
          to: "broadcasts.owner"
        }
      },
      VIPs: {
        relation: Model.HasManyRelation,
        modelClass: VIPs,
        join: {
          from: "channel.channel_id",
          to: "vip_member.owner"
        }
      }
    };
  }
}

module.exports = Channel;
