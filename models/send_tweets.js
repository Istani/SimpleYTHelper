const moment = require("moment");
const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Send_Tweets extends Model {
  static get tableName() {
    return "send_tweet";
  }
  static get idColumn() {
    return "id";
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    this.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
  }
}

module.exports = Send_Tweets;
