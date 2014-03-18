// asy.js

(function () {
'use strict';

var co = require('./co-light');

var Deferred = require('./deferred-promise-light');
var Promise   = Deferred.Promise;
var isPromise = Deferred.isPromise;

function asy(generator) {
  if (typeof generator === 'function' &&
      generator.constructor.name === 'GeneratorFunction') {
    return co(generator);
  }
  else {
    throw new Error('GeneratorFunction needed');
  }
}

module.exports = exports = asy;
exports.co        = co;
exports.delay     = co.delay;
exports.sleep     = co.sleep;
exports.wait      = co.wait;
exports.Deferred  = Deferred;
exports.Promise   = Promise;
exports.isPromise = isPromise;

})();
