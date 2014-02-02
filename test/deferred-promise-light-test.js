// deferred-promise-light-test.js

'use strict';

var DeferredPromiseLight = require('../lib/deferred-promise-light');

var Deferred  = DeferredPromiseLight.Deferred;
var Promise   = DeferredPromiseLight.Promise;
var isPromise = DeferredPromiseLight.isPromise;
var when      = DeferredPromiseLight.when;
var sleep     = DeferredPromiseLight.sleep;
var ok        = DeferredPromiseLight.ok;
var ng        = DeferredPromiseLight.ng;

if (!Deferred)  throw new Error('Deferred not defined');
if (!Promise)   throw new Error('Promise not defined');
if (!isPromise) throw new Error('isPromise not defined');
if (!when)      throw new Error('when not defined');
if (!sleep)     throw new Error('sleep not defined');
if (!ok)        throw new Error('ok not defined');
if (!ng)        throw new Error('ng not defined');

var fs = require('fs');
var startTime = new Date;
function tm() { return ((new Date - startTime)/1000).toFixed(3) + ' %s'; }

function random() {
  var dfd = new Deferred();
  setTimeout(function () { dfd.resolve('OK'); }, Math.random() * 1000);
  setTimeout(function () { dfd.reject('NG');  }, Math.random() * 1000);
  return dfd.promise();
}

function readTextFile(file) {
  console.log(tm(), 'read:', file);
  var dfd = new Deferred();
  fs.readFile(file, function (err, data) {
    if (err) dfd.reject(err);
    else dfd.resolve(data.toString());
  });
  return dfd.promise();
}

console.log(tm(), 'bmk start');
for (var i = 0; i < 1000; ++i) {
  ok('OK').then(function (res) {},
                function (err) {});
  ng('NG').then(function (res) {},
                function (err) {});
}
console.log(tm(), 'bmk end');

ok('OK').then(function (res) { console.log(tm(), 'ok resolve', res); },
              function (err) { console.log(tm(), 'ok reject',  err); });

ng('NG').then(function (res) { console.log(tm(), 'ng resolve', res); },
              function (err) { console.log(tm(), 'ng reject',  err); });



console.log(tm(), 'timer start');
sleep(100).then(function () {
  console.log(tm(), 'timer end');
})
.then(function (res) {
  console.log(tm(), 'sleep', res);
  return when(
    readTextFile('a.txt'),
    readTextFile('b.txt'),
    readTextFile('c.txt'));
})
.then(function (res1, res2, res3) {
  res1 = res1.trim();
  res2 = res2.trim();
  res3 = res3.trim();
  console.log(tm(), 'when', res1, res2, res3);
  return random();
})
.then(function (res) {
  console.log(tm(), 'random OK', res);
}, function (err) {
  console.log(tm(), 'random NG', err);
})
.then(function (res) {
  console.log(tm(), 'read: start');
  return readTextFile('a.txt');
})
.then(function (res) {
  console.log(tm(), 'read: a.txt =', res.trim());
  return readTextFile('b.txt');
})
.then(function (res) {
  console.log(tm(), 'read: b.txt =', res.trim());
  return readTextFile('c.txt');
}).then(function (res) {
  console.log(tm(), 'read: c.txt =', res.trim());
  return 'OK';
}).then(function (res) {
  console.log(tm(), 'last =', res);
}).then(function (res) {
  console.log(tm(), 'final: OK =', res);
}, function (err) {
  console.log(tm(), 'final: NG =', err);
});

// http://d.hatena.ne.jp/cheesepie/20111112/1321064204
// http://wiki.commonjs.org/wiki/Promises/A
// http://tokkono.cute.coocan.jp/blog/slow/index.php/programming/jquery-deferred-for-responsive-applications-basic/
