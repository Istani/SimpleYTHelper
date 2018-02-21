var Zombie = require('zombie');
var cheerio = require('cheerio');

var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  check_permission: function (message_row, SendFunc, NewMessageFunc) {
    var permissions=false;
    
    if (message_row.user=="-1") {
      permissions=true;
    }
    
    permissions=true; // Fake Recht!
    
    if (permissions==false) {
      SendFunc(message_row.user+ " du hast keine Rechte den Befehl auszuführen!\r\n" + message_row.message);
    } else {
      self.execute(message_row, SendFunc, NewMessageFunc);
    }
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    test_load(main_url);
    if (message_row.user!="-1") {
      SendFunc("Humble Sale Scan läuft!");
    }
  }
};
var mysql=null;
var main_url = "https://www.humblebundle.com/store/search?sort=discount";

function test_load(url) {
  var text = new Promise(function(){
    var browser = new Zombie();
    browser.visit(url, function(){
      browser.wait({duration: 10000}).then(function(){
        handle_html(browser.html());
        if (url==main_url) {
          test_load(url+'&page=1');
        }
        if (url==main_url+'&page=1') {
          test_load(url+'&page=2');
        }
        if (url==main_url+'&page=2') {
          test_load(url+'&page=3');
        }
        if (url==main_url+'&page=3') {
          test_load(url+'&page=4');
        }
        if (url==main_url+'&page=4') {
          test_load(url+'&page=5');
        }
      });
    });
  });
}

function handle_html(html) {
  var $ = cheerio.load(html);
  $('.entity-block-container').filter(function() {
    var data = $(this);
    dismantle_entry(data.html());
  });
}

function dismantle_entry(html) {
  var $ = cheerio.load(html);
  var newEntry={};
  newEntry.title=$('.entity-title').text();
  newEntry.discount=$('.discount-percentage').text();
  newEntry.price=$('.price').text();
  newEntry.ref="http://humblebundle.com" + $('.entity-link').attr('href')+ "?partner=defender833";
  // TODO: In Datenbank speichern!
  console.log(newEntry);
}
