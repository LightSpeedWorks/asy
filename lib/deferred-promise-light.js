// deferred-promise-light.js

(function () {
'use strict';

var inherits = require('util').inherits;

var slice = Array.prototype.slice;

var STATES = ['pending', 'resolved', 'rejected'];
var STATE_PENDING  = 0;
var STATE_RESOLVED = 1;
var STATE_REJECTED = 2;

/**
 * class Deferred. Deferredクラス定義
 *
 * constructor() コンストラクタ
 */
function Deferred() {
  if (!(this instanceof Deferred))
    return new Deferred();

  /**
   * state. 状態 (PENDING/UNRESOLVED, RESOLVED, REJECTED)
   */
  this.state_ = STATE_PENDING;

  /**
   * values. 最終値
   */
  this.values = [undefined];

  /**
   * context. コンテキスト
   */
  this.context = null;

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
    return STATES[this.state_];
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
    var context = this.context;
    var values = this.values;
    var state = this.state_;
    this.callbacks.push({cb:callback, eb:errback, pb:progback, dfd:dfd});
    if (state === STATE_RESOLVED) {
      if (callback) callback.apply(context, values);
      dfd.resolve.apply(dfd, values);
    }
    else if (state === STATE_REJECTED) {
      if (errback) errback.apply(context, values);
      dfd.reject.apply(dfd, values);
    }
    return dfd.promise();
  }

  /**
   * Deferred.resolve. 解決
   */
  Deferred.prototype.resolve = Deferred_resolve;
  function Deferred_resolve() {
    if (this.state_ !== STATE_PENDING) return this;
    this.state_ = STATE_RESOLVED;
    var values = this.values = arguments;
    var context = this.context = null;
    this.callbacks.map(function (val, idx, ary) {
      if (typeof val.cb === 'function') {
        var pr = val.cb.apply(context, values);
        var pp = (pr === undefined) ? values: [pr];
        if (isPromise(pr))
          pr.then(function () { val.dfd.resolve.apply(val.dfd, arguments); },
                  function () { val.dfd.reject.apply(val.dfd, arguments); },
                  function () { val.dfd.notify.apply(val.dfd, arguments); });
        else val.dfd.resolve.apply(val.dfd, pp);
      }
      else val.dfd.resolve.apply(val.dfd, values);
    });
    return this;
  }

  /**
   * Deferred.reject. 拒否
   */
  Deferred.prototype.reject = Deferred_reject;
  function Deferred_reject() {
    if (this.state_ !== STATE_PENDING) return this;
    this.state_ = STATE_REJECTED;
    var values = this.values = arguments;
    var context = this.context = null;
    this.callbacks.map(function (val, idx, ary) {
      if (typeof val.eb === 'function') {
        var pr = val.eb.apply(context, values);
        var pp = (pr === undefined) ? values: [pr];
        if (isPromise(pr))
          pr.then(function () { val.dfd.resolve.apply(val.dfd, arguments); },
                  function () { val.dfd.reject.apply(val.dfd, arguments); },
                  function () { val.dfd.notify.apply(val.dfd, arguments); });
        else val.dfd.reject.apply(val.dfd, pp);
      }
      else val.dfd.reject.apply(val.dfd, values);
    });
    return this;
  }

  /**
   * Deferred.notify. 通知
   */
  Deferred.prototype.notify = Deferred_notify;
  function Deferred_notify() {
    if (this.state_ !== STATE_PENDING) return this;
    var values = this.values = arguments;
    var context = this.context = null;
    this.callbacks.map(function (val, idx, ary) {
      if (typeof val.pb === 'function') {
        var pr = val.pb.apply(context, values);
        var pp = (pr === undefined) ? values: [pr];
        if (isPromise(pr))
          pr.then(function () { val.dfd.resolve.apply(val.dfd, arguments); },
                  function () { val.dfd.reject.apply(val.dfd, arguments); },
                  function () { val.dfd.notify.apply(val.dfd, arguments); });
        else val.dfd.notify.apply(val.dfd, pp);
      }
      else val.dfd.notify.apply(val.dfd, values);
    });
    return this;
  }

/**
 * Deferred.promise. 約束
 */
Deferred.prototype.promise = Deferred_promise;
function Deferred_promise() {
  //return new Promise(this);

  var dfd = this;
  var pr = promise;
  pr.deferred_ = this;
  pr.__proto__ = Promise.prototype;
  return pr;

  // promise
  function promise(cb) {
    return pr.then(
      function () {
        dfd.resolve.apply(dfd, arguments);
        if (typeof cb === 'function') {
          var args = slice.apply(arguments);
          args.unshift(null);
          cb.apply(null, args);
        }
      },
      function () {
        dfd.reject.apply(dfd, arguments);
        if (typeof cb === 'function')
          cb.apply(null, arguments);
      },
      function () {
        dfd.notify.apply(dfd, arguments);
      });
  }
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
 * Deferred.progress.
 */
Deferred.prototype.progress = Deferred_progress;
function Deferred_progress(progback) {
  return this.then(undefined, undefined, progback);
}

/**
 * class Promise. Promiseクラス定義
 *
 * constructor(deferred) コンストラクタ
 */
inherits(Promise, Function);
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
 * Promise.done.
 */
Promise.prototype.done = Promise_done;
function Promise_done(callback, errback) {
  return this.then(callback, errback);
}

/**
 * Promise.progress.
 */
Promise.prototype.progress = Promise_progress;
function Promise_progress(progback) {
  return this.then(undefined, undefined, progback);
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

  args.map(function (arg, idx, ary) {
    arg.then(
      function (res) {
        result[idx] = res;
        if (--num === 0) dfd.resolve.apply(dfd, result);
      },
      function (err) {
        result[idx] = err;
        dfd.reject(err);
      }
    ); // arg.then
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

function ok() {
  var dfd = new Deferred();
  dfd.resolve.apply(dfd, arguments);
  return dfd.promise();
}

function ng() {
  var dfd = new Deferred();
  dfd.reject.apply(dfd, arguments);
  return dfd.promise();
}

module.exports = exports = Deferred;
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

