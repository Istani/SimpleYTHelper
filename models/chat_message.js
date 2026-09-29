const moment = require("moment");
const { Model } = require("objection");
const Knex = require("knex");
const sanitizeLegacyMysqlText = require("../youtube/lib/legacy-mysql-text.js");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Chat_Message extends Model {
  static get tableName() {
    return "chat_message";
  }
  static get idColumn() {
    return "service, server, room, id";
  }

  static get relationMappings() {
    const Users = require("./chat_user.js");

    return {
      User: {
        relation: Model.HasManyRelation,
        modelClass: Users,
        join: {
          from: ["chat_message.server", "chat_message.user"],
          to: ["chat_user.server", "chat_user.user"]
        }
      }
    };
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
