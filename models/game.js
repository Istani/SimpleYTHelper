const { Model } = require('objection');
const Knex = require('knex');

const knex = Knex(require("../knexfile.js"));
const fs = require('fs');

Model.knex(knex);

class Game extends Model {
  static get tableName() {
    return 'game_overview';
  }
  static get idColumn() {
    return 'name';
  }

  static get virtualAttributes() {
    return ['lowPrice','highPrice','localBanner'];
  }

  static getEncodedName(name) {
    var reg_exname = name.replace(/ /gi, "_");
    reg_exname = reg_exname.replace(/[\W]+/gi, "");
    return reg_exname;
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
  get localBanner() {
    var path="/img/games/"+this.name+".png";
    var pic_path="./public"+path;
    if (fs.existsSync(pic_path)) {
    } else {
      path="/img/games/no_pic.jpg";
    }
    return path;
  }

  static get relationMappings() {
    const Link = require('./game_link.js');
    const Merch = require('./game_merch.js');

    return {
      links: {
        relation: Model.HasManyRelation,
        modelClass: Link,
        join: {
          from: 'game_overview.name',
          to: 'game_link.name'
        }
      },
      merch: {
        relation: Model.HasManyRelation,
        modelClass: Merch,
        join: {
          from: 'game_overview.name',
          to: 'game_merch.name'
        }
      }
    }
  }
  
  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = Game;
