const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class ChannelAnalyticsHistory extends Model {
  static get tableName() {
    return "channel_analytics_history";
  }
  static get idColumn() {
    return "id";
  }

  $beforeInsert() {
    this.timestamp = new Date().toISOString();
  }
}

module.exports = ChannelAnalyticsHistory;
