'use strict';

var inspect = require('util').inspect;
var slice = Array.prototype.slice;
var co = require('../lib/co-light');
// var co = require('co'); // for compare {オリジナルとの比較用}

function delay(ms) {
  return function (cb) {
    setTimeout(cb, ms);
  };
}

function delayError(ms) {
  return function (cb) {
    setTimeout(function () {
      cb(new Error('delayError'));
    }, ms);  // setTimeout
  };
}

co(function*() {
  console.log('co11');
  yield delay(500);
  console.log('co12');
  yield delay(500);
  console.log('co13');
})(function (err, res) {
  console.log('co1X done:', {err: err, res: res});

  co(function*() {
    console.log('co21');
    yield delay(500);
    console.log('co22');
    try {
      yield delayError(500);
    } catch(err) {
      console.log('co22 -> ' + err);
    }
    console.log('co23');
  })(function (err, res) {
    console.log('co2X done:', {err: err, res: res});
  });

});
