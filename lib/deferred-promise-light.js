// deferred-promise-light.js

(function () {
'use strict';

var util = require('util');

var slice = Array.prototype.slice;

var STATE_PENDING  = 'pending';
var STATE_RESOLVED = 'resolved';
var STATE_REJECTED = 'rejected';

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
  this.state_ = STATE_PENDING;

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
 * Deferred.state. 状態
 */
Deferred.prototype.state = Deferred_state;
function Deferred_state() {
  return this.state_;
}

/**
 * Deferred.isResolved. 解決済み
 */
Deferred.prototype.isResolved = Deferred_isResolved;
function Deferred_isResolved() {
  return this.state_ === STATE_RESOLVED;
}

/**
 * Deferred.isRejected. 拒否済み
 */
Deferred.prototype.isRejected = Deferred_isRejected;
function Deferred_isRejected() {
  return this.state_ === STATE_REJECTED;
}

/**
 * Deferred.then.
 */
Deferred.prototype.then = Deferred_then;
function Deferred_then(callback, errback, progback) {
  var dfd = new Deferred();
  this.callbacks.push({cb:callback, eb:errback, pb:progback, dfd:dfd});
  if (this.state_ === STATE_RESOLVED) {
    if (callback) callback(this.value);
    dfd.resolve(this.value);
  }
  else if (this.state_ === STATE_REJECTED) {
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
  if (this.state_ !== STATE_PENDING) return this;
  this.state_ = STATE_RESOLVED;
  this.value = res;
  this.callbacks.map(function (val, idx, ary) {
    if (typeof val.cb === 'function') {
      var p = val.cb(res);
      var pp = (p === undefined) ? res: p;
      if (isPromise(p))
        p.then(function (res) { val.dfd.resolve(res); },
               function (err) { val.dfd.reject(err); },
               function (res) { val.dfd.notify(res); });
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
  if (this.state_ !== STATE_PENDING) return this;
  this.state_ = STATE_REJECTED;
  this.value = err;
  this.callbacks.map(function (val, idx, ary) {
    if (typeof val.eb === 'function') {
      var p = val.eb(err);
      var pp = (p === undefined) ? err: p;
      if (isPromise(p))
        p.then(function (res) { val.dfd.resolve(res); },
               function (err) { val.dfd.reject(err); },
               function (res) { val.dfd.notify(res); });
      else val.dfd.reject(pp);
    }
    else val.dfd.reject(err);
  });
  return this;
}

/**
 * Deferred.notify. 通知
 */
Deferred.prototype.notify = Deferred_notify;
function Deferred_notify(res) {
  if (this.state_ !== STATE_PENDING) return this;
  this.value = res;
  this.callbacks.map(function (val, idx, ary) {
    if (typeof val.pb === 'function') {
      var p = val.pb(res);
      var pp = (p === undefined) ? res: p;
      if (isPromise(p))
        p.then(function (res) { val.dfd.resolve(res); },
               function (err) { val.dfd.reject(err); },
               function (res) { val.dfd.notify(res); });
      else val.dfd.notify(pp);
    }
    else val.dfd.notify(res);
  });
  return this;
}

/**
 * Deferred.promise. 約束
 */
Deferred.prototype.promise = Deferred_promise;
function Deferred_promise() {
  //return new Promise(this);

  var pr = function (cb) {
    return pr.then(
      function (res) {
        pr.deferred_.resolve(res);
        if (typeof cb === 'function') cb(null, res);
      },
      function (err) {
        pr.deferred_.reject(err);
        if (typeof cb === 'function') cb(err);
      },
      function (res) {
        pr.deferred_.notify(res);
      });
  };
  pr.deferred_ = this;
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
 * Deferred.progress.
 */
Deferred.prototype.progress = Deferred_progress;
function Deferred_progress(progback) {
  return this.then(undefined, undefined, progback);
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

  this.deferred_ = deferred;
}

/**
 * Promise.deferred. 遅延
 */
Promise.prototype.deferred = Promise_deferred;
function Promise_deferred() {
  return this.deferred_;
}

/**
 * Promise.isResolved. 解決済み
 */
Promise.prototype.isResolved = Promise_isResolved;
function Promise_isResolved() {
  return this.deferred_.isResolved();
}

/**
 * Promise.isRejected. 拒否済み
 */
Promise.prototype.isRejected = Promise_isRejected;
function Promise_isRejected() {
  return this.deferred_.isRejected();
}

/**
 * Promise.then.
 */
Promise.prototype.then = Promise_then;
function Promise_then(callback, errback, progback) {
  return this.deferred_.then(callback, errback, progback);
}

/**
 * Promise.fail.
 */
Promise.prototype.fail = Promise_fail;
function Promise_fail(errback) {
  return this.then(undefined, errback);
}

/**
 * Promise.progress.
 */
Promise.prototype.progress = Promise_progress;
function Promise_progress(progback) {
  return this.then(undefined, undefined, progback);
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
        if (--num === 0) dfd.resolve.apply(dfd, result);
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

