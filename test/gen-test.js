'use strict';

var inspect = require('util').inspect;

var data = [true, false, 0, 123, 'abc', null, undefined, {}, []];

function* generator() {
  console.log(inspect(['a', arguments.constructor.name, arguments], {colors: true}));
  for (var i in data)
    yield data[i];
  return 'last';
}

for (var i in data) {
  var gen = generator(data[i]);
  console.log(inspect(['g', gen.constructor.name, gen], {colors: true}));
  do {
    var nx = gen.next(data[i]);
    console.log(inspect(['n', nx.constructor.name, nx], {colors: true}));
  } while (!nx.done);
}
