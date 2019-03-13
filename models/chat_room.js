const { Model } = require('objection');
const Knex = require('knex');

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Chat_Room extends Model {
  static get tableName() {
    return 'chat_room';
  }
  static get idColumn() {
    return 'service, server, room';
  }
}

module.exports = Chat_Room;
