const moment = require("moment");
const { Model } = require("objection");
const Knex = require("knex");
const sanitizeLegacyMysqlText = require("../youtube/lib/legacy-mysql-text.js");

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
    this.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
    if (this.content !== undefined) {
      this.content = sanitizeLegacyMysqlText(this.content);
    }
  }
}

module.exports = Chat_Message;
