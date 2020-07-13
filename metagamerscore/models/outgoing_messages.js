const { Model } = require("objection");
const Knex = require("knex");
const emoji = require("node-emoji");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Chat_Message extends Model {
  static get tableName() {
    return "outgoing_messages";
  }
  static get idColumn() {
    return "service, server, room, id";
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
    this.content = emoji.unemojify(this.content);
  }
}

module.exports = Chat_Message;
