var Queue = require('better-queue');
var q = new Queue(function (input, cb) {
  // Some processing here ...
  input();
  cb(null, result);
})

var cron = require('node-cron');

cron.schedule('* * * * *', function(){
  q.push(()=>{console.log('running a task every minute')});
});
