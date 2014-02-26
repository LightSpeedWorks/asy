// co-light.js

(function () {
'use strict';

var Deferred = require('./deferred-promise-light').Deferred;

var slice = Array.prototype.slice;

// co
function co(generator) {
  if (typeof generator !== 'function' || generator.constructor.name !== 'GeneratorFunction')
    throw new Error('GeneratorFunction needed');

  var dfd = new Deferred();
  var gen = generator();
  callback(null);
  return dfd.promise();

  function callback(err, data) {
    if (err) {
      dfd.reject.apply(dfd, arguments);
      gen.throw(err);
      return;
    }

    var nx = gen.next(data);
    if (nx.done) {
      dfd.resolve(nx.value);
      return;
    }

    var obj = nx.value;

    //console.log('\u001b[33mval\u001b[m', typeof obj, obj);

    if (typeof obj === 'function')
      return obj(callback);

    if (typeof obj === 'object') {

      // Array support
      if (obj instanceof Array) {
        if (obj.length === 0) return callback(null, []);
        return function () {
          var res = [];
          var n = obj.length;
          obj.map(function (obj, idx, ary) {
            obj(function (err, data) {
              if (err) return gen.throw(err);
              res[idx] = data;
              if (--n === 0) return callback(null, res);
            });
          }); // obj.map
        }();
      } // Array support

      // Deferred/Promise support
      if (typeof obj.then === 'function') {
        // console.log('\u001b[32mco Promise?\u001b[m');
        return obj.then(function (res) { return callback(null, res); },
                        function (err) { return gen.throw(err); });
      }

      // Object support
      var keys = Object.keys(obj);
      if (keys.length === 0) return callback(null, {});
      console.log('keys', keys);
      return function () {
        var res = {};
        var n = keys.length;
        keys.map(function (key, i, a) {
          obj[key](function (err, data) {
            if (err) return gen.throw(err);
            res[key] = data;
            if (--n === 0) return callback(null, res);
          });
        }); // keys.map
      }(); // Object support
    }

    if (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'string')
      return callback(null, obj);

    gen.throw(new Error('yield type error: ' + typeof obj + ': ' + obj));
  }
}

function thunkify2(fn) {
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
  return function() {
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
