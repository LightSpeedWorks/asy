asy - Asynchronous, Deferred/Promise, co(coroutine), light library
====

now prepare


```js
var asy = require('asy');

asy(function*() {
  console.log('start');
  yield asy.wait(1000);
  console.log('end after 1 second');
});

var thunkify = asy.thunkify;

var fs = require('fs');
var read = thunkify(fs.readFile);

fs.readFile('test-a.txt', function (err, res) {});
read('test-a.txt')(function (err, res) {});

asy(function*() {
  var buf = yield read('test-a.txt');
});
```
