const { Model } = require('objection');
const Knex = require('knex');

const knex = Knex(require("../../knexfile.js"));

Model.knex(knex);

class Game extends Model {
  static get tableName() {
    return 'game_overview';
  }
  static get idColumn() {
    return 'name';
  }

  static get virtualAttributes() {
    return ['lowPrice','highPrice'];
  }

  get lowPrice() {
    var ret=100000000;
    for(var i=0;i<this.links.length;i++) {
      if (this.links[i].price<ret) {
        ret=this.links[i].price;
      }
    }
    return parseFloat(ret/100).toFixed(2);
  }
  get highPrice() {
    var ret=0;
    for(var i=0;i<this.links.length;i++) {
      if (this.links[i].price>ret) {
        ret=this.links[i].price;
      }
    }
    return parseFloat(ret/100).toFixed(2);
  }

  static get relationMappings() {
    const Link = require('./game_link.js');

    return {
      links: {
        relation: Model.HasManyRelation,
        modelClass: Link,
        join: {
          from: 'game_overview.name',
          to: 'game_link.name'
        }
      }
    }
  }
}

module.exports = Game;
