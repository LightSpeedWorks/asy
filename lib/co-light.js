// co-light.js

(function () {
'use strict';

var Deferred = require('./deferred-promise-light');
var isPromise = Deferred.isPromise;

var slice = Array.prototype.slice;

// co
function co(generator) {
  if (typeof generator !== 'function' ||
      generator.constructor.name !== 'GeneratorFunction') {
    throw new Error('GeneratorFunction needed');
  }

  var dfd = new Deferred();
  var gen = generator();
  callback(null);
  return dfd.promise();

  // callback
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

    doObject(nx.value);

    // do Object
    function doObject(obj) {
      //console.log('\u001b[33mval\u001b[m', typeof obj, obj);

      // null, undefined, number, boolean, string
      if (obj === null || obj === undefined ||
          typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'string')
        return callback(null, obj);

      // call generator function
      if (typeof obj === 'function') {
        if (obj.constructor.name === 'GeneratorFunction') {
          // call generator function
          return co(obj)(callback);
        }
        else {
          // call Thunk function
          return obj(callback);
        }
      }

      if (typeof obj !== 'object')
        return gen.throw(new Error('yield type error: ' + typeof obj + ': ' + obj));

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
        }(); // return
      } // Array support

      // Deferred/Promise support
      if (isPromise(obj)) {
        // console.log('\u001b[32mco Promise?\u001b[m');
        return obj.then(function (res) { return callback(null, res); },
                        function (err) { return gen.throw(err); });
      } // Deferred/Promise support

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

    } // function doObject
  } // function callback
} // function co

function thunkify2(func) {
  return function () { //= yield で呼び出す 実引数を持つ
    var args = slice.call(arguments);
    var results;
    var called = false;
    var cb = null;

    // add callback-function to args
    args.push(function () {
      results = arguments;
      if (!cb || called) return;
      called = true;
      cb.apply(this, results);
    });
    func.apply(this, args);

    return function (fn) {
      cb = fn;
      if (!results || called) return;
      called = true;
      cb.apply(this, results);
    };
  };
}

function thunkify(func) {
  return function() {
    var args = slice.call(arguments);
    return function(callback) {
      args.push(callback);
      func.apply(this, args);
    };
  };
}


function delay(ms) {
  return function (cb) {
    setTimeout(cb, ms);
  };
}

function sleep(ms) {
  return function (cb) {
    setTimeout(cb, ms);
  };
}

function wait(ms) {
  return function (cb) {
    setTimeout(cb, ms);
  };
}

module.exports = exports = co;
exports.co = co;
exports.thunkify = thunkify;
exports.thunkify2 = thunkify2;
exports.delay = delay;
exports.sleep = sleep;
exports.wait  = wait;

})();
