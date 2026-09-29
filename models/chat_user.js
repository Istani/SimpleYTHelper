const moment = require("moment");
const { Model } = require("objection");
const Knex = require("knex");
const sanitizeLegacyMysqlText = require("../youtube/lib/legacy-mysql-text.js");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Chat_User extends Model {
  static get tableName() {
    return "chat_user";
  }
  static get idColumn() {
    return "service, server, user";
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    this.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
    if (this.name !== undefined) {
      this.name = sanitizeLegacyMysqlText(this.name);
    }
  }
}

module.exports = Chat_User;
