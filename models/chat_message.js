const { Model } = require('objection');
const Knex = require('knex');

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Chat_Message extends Model {
  static get tableName() {
    return 'chat_message';
  }
  static get idColumn() {
    return 'service, server, room, id';
  }
}

module.exports = Chat_Message;
