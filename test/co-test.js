'use strict';

var co = require('../lib/co-light').co;
var thunkify = require('../lib/co-light').thunkify;
co.sleep = require('../lib/co-light').sleep;

var Deferred = require('../lib/deferred-promise-light').Deferred;
//var Promise = require('../lib/deferred-promise-light').Promise;
Deferred.sleep = require('../lib/deferred-promise-light').sleep;

//var fs = require('co-fs');
var fs = require('fs');
co.fs = co.fs || {};
co.fs.readFile = thunkify(fs.readFile);

co(function *() {
  console.log('co sleep 1');
  yield co.sleep(100);
  console.log('co sleep 2');
  yield co.sleep(100);
  console.log('co sleep 3');

  var a = yield co.fs.readFile('a.txt');
  console.log('a.txt =', a.toString().trim());
  var b = yield co.fs.readFile('b.txt');
  console.log('b.txt =', b.toString().trim());
  var c = yield co.fs.readFile('c.txt');
  console.log('c.txt =', c.toString().trim());

  var a1 = co.fs.readFile('a.txt');
  var b1 = co.fs.readFile('b.txt');
  var c1 = co.fs.readFile('c.txt');
  var res = yield [a1, b1, c1];
  for (var i in res)
    res[i] = res[i].toString().trim();
  //var res = (yield [a1, b1, c1]).map(function (v) {
  //  return v.toString().trim();
  //});
  console.log('res =', res);

  var res = yield [];
  console.log('res =', res);

  var res = yield {};
  console.log('res =', res);

  var a2 = co.fs.readFile('a.txt');
  var b2 = co.fs.readFile('b.txt');
  var c2 = co.fs.readFile('c.txt');
  var res = yield {a:a2, b:b2, c:c2};
  for (var i in res)
    res[i] = res[i].toString().trim();
  console.log('res =', res);

  console.log('Deferred sleep 1');
  yield Deferred.sleep(100);
  console.log('Deferred sleep 2');
  yield Deferred.sleep(100);
  console.log('Deferred sleep 3');

  var x = yield 10;
  console.log('x', x);
  var y = yield true;
  console.log('y', y);
  var z = yield 'zzz';
  console.log('z', z);
  return 'ZZZ';
//})(function (err, res) { console.log('END', err, res); }); // co

}).then(function (res) { console.log('END', res); }); // co

