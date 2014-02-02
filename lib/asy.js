// asy.js

(function () {
'use strict';

var coLight = require('./co-light');
var co = coLight.co;

var DeferredPromiseLight = require('./deferred-promise-light');
var Deferred  = DeferredPromiseLight.Deferred;
var Promise   = DeferredPromiseLight.Promise;
var isPromise = DeferredPromiseLight.isPromise;

function asy() {
  if (typeof arguments[0] === 'function' &&
      arguments[0].constructor.name = 'GeneratorFunction')
    return co(arguments[0]);
  else
    throw new Error('GeneratorFunction needed');
}

asy.co        = co;
asy.Deferred  = Deferred;
asy.Promise   = Promise;
asy.isPromise = isPromise;

exports = module.exports = asy;

})();
