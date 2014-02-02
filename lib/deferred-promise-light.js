// deferred-promise-light.js

(function () {
'use strict';

var util = require('util');

var slice = Array.prototype.slice;

var STATE_UNRESOLVED = 0;
var STATE_RESOLVED = 1;
var STATE_REJECTED = 2;

/**
 * class Deferred.
 *
 * constructor()
 */
function Deferred() {
  if (!(this instanceof Deferred))
    return new Deferred();

  /**
   * state. 状態 (UNRESOLVED, RESOLVED, REJECTED)
   */
  this.state = STATE_UNRESOLVED;

  /**
   * value. 最終値
   */
  this.value = undefined;

  /**
   * array of callbacks. コールバック配列
   */
  this.callbacks = [];
}

/**
 * Deferred.isResolved. 解決済み
 */
Deferred.prototype.isResolved = Deferred_isResolved;
function Deferred_isResolved() {
  return this.state === STATE_RESOLVED;
}

/**
 * Deferred.isRejected. 拒否済み
 */
Deferred.prototype.isRejected = Deferred_isRejected;
function Deferred_isRejected() {
  return this.state === STATE_REJECTED;
}

/**
 * Deferred.then.
 */
Deferred.prototype.then = Deferred_then;
function Deferred_then(callback, errback) {
  var dfd = new Deferred();
  this.callbacks.push({cb:callback, eb:errback, dfd:dfd});
  if (this.state === STATE_RESOLVED) {
    if (callback) callback(this.value);
    dfd.resolve(this.value);
  }
  else if (this.state === STATE_REJECTED) {
    if (errback) errback(this.value);
    dfd.reject(this.value);
  }
  return dfd.promise();
}

/**
 * Deferred.resolve. 解決
 */
Deferred.prototype.resolve = Deferred_resolve;
function Deferred_resolve(res) {
  if (this.state !== STATE_UNRESOLVED) return this;
  this.state = STATE_RESOLVED;
  this.value = res;
  this.callbacks.map(function (val, idx, ary) {
    if (typeof val.cb === 'function') {
      var p = val.cb(res);
      var pp = (p === undefined) ? res: p;
      if (isPromise(p))
        p.then(function (res) { val.dfd.resolve(res); },
               function (err) { val.dfd.reject(err); });
      else val.dfd.resolve(pp);
    }
    else val.dfd.resolve(res);
  });
  return this;
}

/**
 * Deferred.reject. 拒否
 */
Deferred.prototype.reject = Deferred_reject;
function Deferred_reject(err) {
  if (this.state !== STATE_UNRESOLVED) return this;
  this.state = STATE_REJECTED;
  this.value = err;
  this.callbacks.map(function (val, idx, ary) {
    if (typeof val.eb === 'function') {
      var p = val.eb(err);
      var pp = (p === undefined) ? err: p;
      if (isPromise(p))
        p.then(function (res) { val.dfd.resolve(res); },
               function (err) { val.dfd.reject(err); });
      else val.dfd.reject(pp);
    }
    else val.dfd.reject(err);
  });
  return this;
}

/**
 * Deferred.promise. 約束
 */
Deferred.prototype.promise = Deferred_promise;
function Deferred_promise() {
  //return new Promise(this);

  //var dfd = this;
  //return {
  //  then: function () { return dfd.then.apply(dfd, arguments); },
  //  done: function () { return dfd.then.apply(dfd, arguments); },
  //  fail: function fail(errback) { return this.then(undefined, errback); },
  //};

  var pr = function (cb) {
    return pr.then(
      function (res) {
        pr.deferred.resolve(res);
        if (typeof cb === 'function') cb(null, res);
      },
      function (err) {
        pr.deferred.reject(err);
        if (typeof cb === 'function') cb(err);
      });
  };
  pr.deferred = this;
  pr.__proto__ = Promise.prototype;
  return pr;
}

/**
 * Deferred.fail.
 */
Deferred.prototype.fail = Deferred_fail;
function Deferred_fail(errback) {
  return this.then(undefined, errback);
}

/**
 * Deferred.done.
 */
Deferred.prototype.done = Deferred_done;
function Deferred_done(callback, errback) {
  return this.then(callback, errback);
}

/**
 * class Promise.
 *
 * constructor(deferred)
 */
util.inherits(Promise, Function);
function Promise(deferred) {
  if (!(this instanceof Promise))
    return new Promise(deferred);

  if (typeof deferred !== 'object' || !(deferred instanceof Deferred))
    throw new Error('Deferred object needed');

  this.deferred = deferred;
}

/**
 * Promise.isResolved. 解決済み
 */
Promise.prototype.isResolved = Promise_isResolved;
function Promise_isResolved() {
  return this.deferred.isResolved();
}

/**
 * Promise.isRejected. 拒否済み
 */
Promise.prototype.isRejected = Promise_isRejected;
function Promise_isRejected() {
  return this.deferred.isRejected();
}

/**
 * Promise.then.
 */
Promise.prototype.then = Promise_then;
function Promise_then(callback, errback) {
  return this.deferred.then(callback, errback);
}

/**
 * Promise.fail.
 */
Promise.prototype.fail = Promise_fail;
function Promise_fail(errback) {
  return this.then(undefined, errback);
}

/**
 * Promise.done.
 */
Promise.prototype.done = Promise_done;
function Promise_done(callback, errback) {
  return this.then(callback, errback);
}

/**
 * when.
 */
function when() {
  var dfd = new Deferred();

  if (arguments.length === 0) {
    dfd.resolve();
    return dfd.promise();
  }

  var args = slice.apply(arguments);
  var num = args.length;
  var result = [];

  args.map(function (val, idx, ary) {
    args[idx].then(
      function (res) {
        result[idx] = res;
        if (--num === 0) dfd.resolve(result);
      },
      function (err) {
        result[idx] = err;
        dfd.reject(err);
      }
    ); // args[idx].then
  }); // args.map
  return dfd.promise();
}
Promise.when = when;
Deferred.when = when;

/**
 * isPromise.
 */
function isPromise(pr) {
  return pr && (typeof pr === 'object' || typeof pr === 'function') && typeof pr.then === 'function';
}
Promise.isPromise = isPromise;
Deferred.isPromise = isPromise;

/**
 * sleep.
 */
function sleep(ms) {
  var dfd = new Deferred();
  setTimeout(function () {
    dfd.resolve();
  }, ms);
  return dfd.promise();
}
Promise.sleep = sleep;
Deferred.sleep = sleep;

function ok(res) {
  var dfd = new Deferred();
  dfd.resolve(res);
  return dfd.promise();
}

function ng(err) {
  var dfd = new Deferred();
  dfd.reject(err);
  return dfd.promise();
}

exports.Deferred  = Deferred;
exports.Promise   = Promise;
exports.isPromise = isPromise;
exports.when      = when;
exports.sleep     = sleep;
exports.ok        = ok;
exports.ng        = ng;

})();

// http://d.hatena.ne.jp/cheesepie/20111112/1321064204
// http://wiki.commonjs.org/wiki/Promises/A
// http://tokkono.cute.coocan.jp/blog/slow/index.php/programming/jquery-deferred-for-responsive-applications-basic/

