asy - async await library
====

deprecated. use aa.


```js
var aa = require('aa');

aa(function*() {
  console.log('start');
  yield aa.wait(1000);
  console.log('end after 1 second');
});

var thunkify = aa.thunkify;

var fs = require('fs');
var read = thunkify(fs.readFile);

fs.readFile('README.md', function (err, res) {});
read('README.md')(function (err, res) {});

aa(function*() {
  var buf = yield read('README.md');
});
```
