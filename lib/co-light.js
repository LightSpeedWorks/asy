// co-light.js

'use strict';

(function () {

var Deferred = require('./deferred-promise-light').Deferred;

// co
function co(generator) {
  var dfd = new Deferred();
  var gen = generator();
  done(null);
  return dfd.promise();

  function done(err, data) {
    if (err) {
      dfd.reject(err);
      gen.throw(err);
      return;
    }

    var nx = gen.next(data);
    if (nx.done) {
      dfd.resolve(nx.value);
      return;
    }

    var val = nx.value;

    //console.log('\u001b[33mval\u001b[m', typeof val, val);

    if (typeof val === 'function')
      return val(done);

    if (typeof val === 'object') {

      // Array support
      if (val instanceof Array) {
        if (val.length === 0) return done(null, []);
        return function () {
          var res = [];
          var n = val.length;
          val.map(function (val, idx, ary) {
            val(function (err, data) {
              if (err) return gen.throw(err);
              res[idx] = data;
              if (--n === 0) return done(null, res);
            });
          }); // val.map
        }();
      } // Array support

      // Deferred/Promise support
      if (typeof val.then === 'function') {
        // console.log('\u001b[32mco Promise?\u001b[m');
        return val.then(function (res) { return done(null, res); },
                        function (err) { return gen.throw(err); });
      }

      // Object support
      var keys = Object.keys(val);
      if (keys.length === 0) return done(null, {});
      console.log('keys', keys);
      return function () {
        var res = {};
        var n = keys.length;
        keys.map(function (key, i, a) {
          val[key](function (err, data) {
            if (err) return gen.throw(err);
            res[key] = data;
            if (--n === 0) return done(null, res);
          });
        }); // keys.map
      }(); // Object support
    }

    if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'string')
      return done(null, val);

    gen.throw(new Error('yield type error: ' + typeof val + ': ' + val));
  }
}

function thunkify2(fn) {
  var slice = Array.prototype.slice;
  return function () { //= yield で呼び出す 実引数を持つ
    var args = slice.call(arguments);
    var results;
    var called;
    var cb;

    args.push(function () {
      results = arguments;
      if (!cb || called) return;
      called = true;
      cb.apply(this, results);
    });
    fn.apply(this, args);

    return function (fn) {
      cb = fn;
      if (!results || called) return;
      called = true;
      cb.apply(this, results);
    };
  };
}

function thunkify(fn) {
  var slice = Array.prototype.slice;
  return function() { //= yield で呼び出す 実引数を持つ
    var args = slice.call(arguments);
    return function(callback) {
      args.push(callback);
      fn.apply(this, args);
    }
  }
}


function sleep(ms) {
  return function (cb) {
    setTimeout(cb, ms);
  }
}

exports.co = co;
exports.thunkify = thunkify;
exports.thunkify2 = thunkify2;
exports.sleep = sleep;

})();
