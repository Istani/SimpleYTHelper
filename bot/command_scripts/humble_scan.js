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
    sale_load(main_url);
    
    
    if (message_row.user!="-1") {
      SendFunc("Humble Scan läuft!");
    }
  }
};
var mysql=null;
var main_url = "https://www.humblebundle.com/store/search?sort=discount";
var max_pages=10;

function sale_load(url) {
  var text = new Promise(function(){
    var browser = new Zombie();
    browser.visit(url, function(){
      browser.wait({duration: 10000}).then(function(){
        scan_handle_html(browser.html());
        if (url==main_url) {  // Beim ersten mal haben wir den Parameter ja noch nicht...
          sale_load(main_url+'&page=1');
        }
        for (var page_id = 1;page_id<(max_pages-1);page_id++) {
          if (url==main_url+'&page='+page_id) {
            sale_load(main_url+'&page='+(page_id+1));
          }
        }
      });
    });
  });
}

function scan_handle_html(html) {
  var $ = cheerio.load(html);
  $('.entity-block-container').filter(function() {
    var data = $(this);
    scan_dismantle_entry(data.html());
  });
}

function scan_dismantle_entry(html) {
  var $ = cheerio.load(html);
  var newEntry={};
  newEntry.title=$('.entity-title').text();
  newEntry.discount=$('.discount-percentage').text();
  newEntry.price=$('.price').text();
  newEntry.ref="http://humblebundle.com" + $('.entity-link').attr('href')+ "?partner=defender833";
  // TODO: In Datenbank speichern!
  console.log(newEntry);
}
