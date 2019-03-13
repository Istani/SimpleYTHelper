const { Model } = require('objection');
const Knex = require('knex');

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Chat_Server extends Model {
  static get tableName() {
    return 'chat_server';
  }
  static get idColumn() {
    return 'service, server';
  }
}

module.exports = Chat_Server;
