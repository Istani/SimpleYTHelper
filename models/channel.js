const { Model } = require('objection');
const Knex = require('knex');

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Channel extends Model {
  static get tableName() {
    return 'channel';
  }
  static get idColumn() {
    return 'user_id, service, channel_id';
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = Channel;
