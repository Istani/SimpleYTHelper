const moment = require("moment");
const { Model } = require("objection");
const Knex = require("knex");
const knex = Knex(require("../knexfile.js"));
Model.knex(knex);

class SythApiKey extends Model {
  static get tableName() {
    return "syth_api_key";
  }
  static get idColumn() {
    return "id";
  }
  $beforeInsert() {
    this.$beforeUpdate();
    this.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
  }
  $beforeUpdate() {
    this.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
  }
}
module.exports = SythApiKey;
