var puppeteer = require('puppeteer');
var cheerio = require('cheerio');
var moment=require("moment");


var mysql=null;
var sale_main_url = "https://www.humblebundle.com/store/search?sort=discount";
var max_pages=2;//20;
var is_running=false;

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
    if (is_running==false) {
      is_running=true;
      (async function save_load() {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
    
        url=sale_main_url;
    
        for (var i=0;i<max_pages-1;i++) {
    
          if (i>0) {
            url=sale_main_url+'&page='+(i);
          }
    
          await console.log(url);
          await page.goto(url);
    
          await page.waitFor(10000);
    
          const dimensions = await page.evaluate(() => {
            return {
              width: document.documentElement.clientWidth,
              height: document.documentElement.clientHeight,
              deviceScaleFactor: window.devicePixelRatio,
              html: document.documentElement.outerHTML
            };
          });
          
          //await scan_handle_html(dimensions.html);
    
          if (i==0) {
            await scan_pages_html(dimensions.html);
          }
        }
        is_running=false;
        
        await browser.close();
      });
      
      if (message_row.user!="-1") {
        //SendFunc("Humble Scan startet!");
      }
    } else {
      //SendFunc("Humble Scan läuft!");
    }
  }
};


function scan_pages_html(html) {
	var $ = cheerio.load(html);
	$('.pagination').filter(function() {
		var data = $(this);
		scan_dismantle_pages(data.html());
	});
}

function scan_dismantle_pages(html) {
  var $ = cheerio.load(html);
  $('.grid-page').each(function (i, elem) {
    max_pages=$(this).attr('data-page-index');
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
  var title="";
  
  newEntry.link="http://humblebundle.com" + $('.entity-link').attr('href');
  title=$('.entity-title').text();
  newEntry.text=title.replace("'", "");
  newEntry.price=$('.price').text();
  newEntry.discount=$('.discount-percentage').text();
  newEntry.last_check=Math.round(moment());
  newEntry.type="Store";
  // TODO: In Datenbank speichern!
  entry_mysql(newEntry);
}


function entry_mysql(entry) {
  //console.log(entry);
  
  var SQL = "SELECT * FROM bot_humble WHERE link='"+entry.link+"'";
  mysql.query(SQL, function (err, rows) {
    if (err != null) {
      console.log(SQL);
      console.log(err);
      return;
    }
    var SQL_FELDER="";
    SQL_FELDER+="link='"+entry.link+"', ";
    SQL_FELDER+="text='"+entry.text+"', ";
    SQL_FELDER+="price='"+entry.price+"', ";
    SQL_FELDER+="discount='"+entry.discount+"', ";
    SQL_FELDER+="type='"+entry.type+"', ";
    SQL_FELDER+="last_check='"+entry.last_check+"' ";
    if (rows.length==0) {
      var SQL2="INSERT INTO bot_humble SET "+SQL_FELDER;
    } else {
      var SQL2="UPDATE bot_humble SET "+SQL_FELDER+" WHERE link='"+entry.link+"'";
    }
    mysql.query(SQL2, function (err2, rows2) {
      if (err2 != null) {
        console.log(SQL2);
        console.log(err2);
        return;
      }
      
    });
  });
}