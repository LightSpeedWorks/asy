// deferred-promise-light.js

(function () {
'use strict';

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
  var state = STATE_PENDING;

  /**
   * values. 最終値
   */
  var values = [undefined];

  /**
   * context. コンテキスト
   */
  var context = null;

  /**
   * array of callbacks. コールバック配列
   */
  var callbacks = [];

  /**
   * Deferred.state. 状態
   */
  this.state = Deferred_state;
  function Deferred_state() {
    return STATES[state];
  }

  /**
   * Deferred.isResolved. 解決済み
   */
  this.isResolved = Deferred_isResolved;
  function Deferred_isResolved() {
    return state === STATE_RESOLVED;
  }

  /**
   * Deferred.isRejected. 拒否済み
   */
  this.isRejected = Deferred_isRejected;
  function Deferred_isRejected() {
    return state === STATE_REJECTED;
  }

  /**
   * Deferred.then.
   */
  this.then = Deferred_then;
  function Deferred_then(callback, errback, progback) {
    var dfd = new Deferred();
    callbacks.push({cb:callback, eb:errback, pb:progback, dfd:dfd});
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
  this.resolve = Deferred_resolve;
  function Deferred_resolve() {
    if (state !== STATE_PENDING) return this;
    state = STATE_RESOLVED;
    values = arguments;
    context = null;
    callbacks.map(function (val, idx, ary) {
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
  this.reject = Deferred_reject;
  function Deferred_reject() {
    if (state !== STATE_PENDING) return this;
    state = STATE_REJECTED;
    values = arguments;
    context = null;
    callbacks.map(function (val, idx, ary) {
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
  this.notify = Deferred_notify;
  function Deferred_notify() {
    if (state !== STATE_PENDING) return this;
    values = arguments;
    context = null;
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

}

/**
 * Deferred.promise. 約束
 */
Deferred.prototype.promise = Deferred_promise;
function Deferred_promise() {
  return new Promise(this);
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
function Promise(deferred) {
  if (!(this instanceof Promise))
    return new Promise(deferred);

  if (typeof deferred !== 'object' || !(deferred instanceof Deferred))
    throw new Error('Deferred object needed');

  /**
   * Promise.isResolved. 解決済み
   */
  this.isResolved = Promise_isResolved;
  function Promise_isResolved() {
    return deferred.isResolved();
  }

  /**
   * Promise.isRejected. 拒否済み
   */
  this.isRejected = Promise_isRejected;
  function Promise_isRejected() {
    return deferred.isRejected();
  }

  /**
   * Promise.then.
   */
  this.then = Promise_then;
  function Promise_then(callback, errback, progback) {
    return deferred.then(callback, errback, progback);
  }
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

