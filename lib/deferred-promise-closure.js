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
  this.isResolved = Deferred_isResolved;
  function Deferred_isResolved() { return state === STATE_RESOLVED; }

  /**
   * isRejected. 拒否済み
   */
  this.isRejected = Deferred_isRejected;
  function Deferred_isRejected() { return state === STATE_REJECTED; }

  /**
   * then.
   */
  this.then = Deferred_then;
  function Deferred_then(callback, errback) {
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
  }

  /**
   * resolve. 解決
   */
  this.resolve = Deferred_resolve;
  function Deferred_resolve(res) {
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
  }

  /**
   * reject. 拒否
   */
  this.reject = Deferred_reject;
  function Deferred_reject(err) {
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
  }
}

/**
 * Deferred.promise. 約束
 */
Deferred.prototype.promise = Deferred_promise;
function Deferred_promise() { return new Promise(this); }

/**
 * Deferred.fail.
 */
Deferred.prototype.fail = Deferred_fail;
function Deferred_fail(errback) { return this.then(undefined, errback); }

/**
 * Deferred.done.
 */
Deferred.prototype.done = Deferred_done;
function Deferred_done(callback, errback) { return this.then(callback, errback); }

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
  this.isResolved = Promise_isResolved;
  function Promise_isResolved() { return deferred.isResolved(); }

  /**
   * isRejected. 拒否済み
   */
  this.isRejected = Promise_isRejected;
  function Promise_isRejected() { return deferred.isRejected(); }

  /**
   * then.
   */
  this.then = Promise_then;
  function Promise_then(callback, errback) {
    return deferred.then(callback, errback);
  }
}

/**
 * Promise.fail.
 */
Promise.prototype.fail = Promise_fail;
function Promise_fail(errback) { return this.then(undefined, errback); }

/**
 * Promise.done.
 */
Promise.prototype.done = Promise_done;
function Promise_done(callback, errback) {
  return this.then(callback, errback);
}

/**
 * isPromise.
 */
Promise.isPromise = Promise_isPromise;
function Promise_isPromise(promise) {
  return promise && (typeof promise === 'object' || typeof promise === 'function') &&
         typeof promise.then === 'function';
}

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

