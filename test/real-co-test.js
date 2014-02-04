// asy-test.js

'use strict';
var fs = require('fs');
var co = require('co');
var thunkify = require('thunkify');
//var asy = require('asy');

var slice = Array.prototype.slice;

//for (var i in asy)
//  console.log('asy', i);

//for (var i in asy.co)
//  console.log('asy.co', i);

//for (var i in asy.Deferred)
//  console.log('asy.Deferred', i);

co.fs = co.fs || {}
co.fs.readFile = thunkify(fs.readFile);

//asy.fs = asy.fs || {}
//asy.fs.readFile = asy.co.thunkify(fs.readFile);

function readTextFileTrimAsync2(file) {
  var args = slice.call(arguments);
  return readTextFileTrimCall;

  function readTextFileTrimCall(callback) {
    args.push(toStringTrimCallback);
    fs.readFile.apply(fs, args);

    function toStringTrimCallback(err, data) {
      if (!err) {
        data = data.toString().trim();
      }
      return callback(err, data);
    }
  }
}

function readTextFileTrimAsync(file) {
  return co(function *() {
    var data = yield co.fs.readFile(file);
    return data.toString().trim();
  });
}

co(function *main() {
  //var a = yield asy.fs.readFile('a.txt');
  //var b = yield asy.fs.readFile('b.txt');
  //var c = yield asy.fs.readFile('c.txt');
  var a = yield readTextFileTrimAsync('a.txt');
  var b = yield readTextFileTrimAsync('b.txt');
  var c = yield readTextFileTrimAsync('c.txt');
  console.log(a, b, c);

  var res = yield [readTextFileTrimAsync('a.txt'),
                   readTextFileTrimAsync('b.txt'),
                   readTextFileTrimAsync('c.txt')];
  console.log(res);
})(function (err, data) { console.log('end of co', err, data); });

