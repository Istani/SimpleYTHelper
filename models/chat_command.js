const moment = require("moment");
const { Model } = require("objection");
const Knex = require("knex");
const knex = Knex(require("../knexfile.js"));
Model.knex(knex);
class ChatCommand extends Model {
  static get tableName() {
    return "chat_command";
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
module.exports = ChatCommand;
