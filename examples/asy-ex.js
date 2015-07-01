var asy = require('../asy');

asy(function*() {
  console.log('start');
  yield asy.wait(1000);
  console.log('end after 1 second');
});

var thunkify = asy.thunkify;

var fs = require('fs');
var read = thunkify(fs.readFile);

fs.readFile('asy-ex.js', function (err, res) {});
read('asy-ex.js')(function (err, res) {});

asy(function*() {
  var buf = yield read('asy-ex.js');
});
