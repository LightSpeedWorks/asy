// deferred-promise-light.js

'use strict';

(function () {

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
  var state = STATE_UNRESOLVED;

  /**
   * value. 最終値
   */
  var value;

  /**
   * array of callbacks. コールバック配列
   */
  var callbacks = [];

  /**
   * isResolved. 解決済み
   */
  this.isResolved = function isResolved() { return state === STATE_RESOLVED; };

  /**
   * isRejected. 拒否済み
   */
  this.isRejected = function isRejected() { return state === STATE_REJECTED; };

  /**
   * then.
   */
  this.then = function then(callback, errback) {
    var dfd = new Deferred();
    callbacks.push({cb:callback, eb:errback, dfd:dfd});
    if (state == STATE_RESOLVED) {
      if (callback) callback(value);
      dfd.resolve(value);
    }
    else if (state == STATE_REJECTED) {
      if (errback) errback(value);
      dfd.reject(value);
    }
    return dfd.promise();
  };

  /**
   * resolve. 解決
   */
  this.resolve = function resolve(res) {
    if (state !== STATE_UNRESOLVED) return this;
    state = STATE_RESOLVED;
    value = res;
    callbacks.map(function (val, idx, ary) {
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
  };

  /**
   * reject. 拒否
   */
  this.reject = function reject(err) {
    if (state !== STATE_UNRESOLVED) return this;
    state = STATE_REJECTED;
    value = err;
    callbacks.map(function (val, idx, ary) {
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
  };
}
/**
 * promise. 約束
 */
Deferred.prototype.promise = function promise() { return new Promise(this); };

/**
 * fail.
 */
Deferred.prototype.fail = function fail(errback) { return this.then(undefined, errback); };
/**
 * done.
 */
Deferred.prototype.done = function then(callback, errback) {
    return this.then(callback, errback);
};

/**
 * class Promise.
 *
 * constructor(deferred)
 */
function Promise(deferred) {
  if (!(this instanceof Promise))
    return new Promise(deferred);

  if (typeof deferred !== 'object' || !(deferred instanceof Deferred))
    throw new Error('Deferred object needed');

  /**
   * isResolved. 解決済み
   */
  this.isResolved = function isResolved() { return deferred.isResolved(); };
  /**
   * isRejected. 拒否済み
   */
  this.isRejected = function isRejected() { return deferred.isRejected(); };

  /**
   * then.
   */
  this.then = function then(callback, errback) {
    return deferred.then(callback, errback);
  };
}
/**
 * fail.
 */
Promise.prototype.fail = function fail(errback) { return this.then(undefined, errback); };
/**
 * done.
 */
Promise.prototype.done = function then(callback, errback) {
    return this.then(callback, errback);
};

/**
 * isPromise.
 */
function isPromise(fn) {
  return fn && (typeof fn === 'object' || typeof fn === 'function') && typeof fn.then === 'function';
}
Promise.isPromise = isPromise;

/**
 * sleep.
 */
function sleep(ms) {
  var dfd = new Deferred();
  setTimeout(function () { dfd.resolve(); }, ms);
  return dfd.promise();
}
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
exports.sleep     = sleep;
exports.ok        = ok;
exports.ng        = ng;

})();

// http://d.hatena.ne.jp/cheesepie/20111112/1321064204
// http://wiki.commonjs.org/wiki/Promises/A
// http://tokkono.cute.coocan.jp/blog/slow/index.php/programming/jquery-deferred-for-responsive-applications-basic/

