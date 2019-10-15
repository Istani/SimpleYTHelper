const { Model } = require('objection');
const Knex = require('knex');

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Chat_Message extends Model {
  static get tableName() {
    return 'outgoing_messages';
  }
  static get idColumn() {
    return 'service, server, room, id';
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = Chat_Message;
