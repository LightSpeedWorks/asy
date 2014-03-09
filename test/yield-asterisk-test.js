'use strict';

var inspect = require('util').inspect;

function* generator() {
  yield 201;
  yield 202;
  return 299;
}

function* generator2() {
  yield 1001;
  yield* generator();
  yield 1002;
  for (var val of generator()) yield val;
  yield 1003;
  for (var it = generator(), n; n = it.next(), !n.done; )
    yield n.value;
  yield 1004;
  yield* function* () {
    yield 301;
    yield 302;
    return 399;
  }();
  yield 1005;
  yield* new MyGenerator();
  return 1999;
}

function MyGenerator() {
  var data = [401, 402];
  var i = 0, n = data.length;

  this.next = function next() {
    return i < n ?
      {value: data[i++], done: false} :
      {value: 499, done: true};
  }
}

for (var iter = generator2(), n; n = iter.next(), !n.done; )
  console.log(n.value);
