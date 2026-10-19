const { Model } = require("objection");
const Knex = require("knex");
const knex = Knex(require("../knexfile.js"));
Model.knex(knex);

class SythApiUsage extends Model {
  static get tableName() {
    return "syth_api_usage";
  }
  static get idColumn() {
    return "id";
  }
}
module.exports = SythApiUsage;
