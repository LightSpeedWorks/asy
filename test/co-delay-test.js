'use strict';

var inspect = require('util').inspect;
var slice = Array.prototype.slice;
var co = require('../lib/co-light');

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
  console.log('co1');
  yield delay(1000);
  console.log('co2');
  yield delay(1000);
  console.log('co3');
})(function () {
  console.log('done', inspect(slice.call(arguments), {colors: true}));

  co(function*() {
    console.log('co1');
    yield delay(1000);
    console.log('co2');
    try {
      yield delayError(1000);
    } catch(err) {
      console.log('co2 -> ' + err);
    }
    console.log('co3');
  })(function () {
    console.log('done', inspect(slice.call(arguments), {colors: true}));
  });

});
