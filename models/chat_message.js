const { Model } = require("objection");
const Knex = require("knex");
const emoji = require("node-emoji");

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
    this.updated_at = new Date().toISOString();
    this.content = emoji.unemojify(this.content);
  }
}

module.exports = Chat_Message;
