'use strict';
var inspect = require('util').inspect;

function Array_next() {
  // console.log(inspect(this, {colors: true}));

  // this : Array
  if (this.index_ === undefined) {
    if (Object.defineProperty) {
      Object.defineProperty(this, 'index_', { value: 0,
        enumerable: false, configurable: true, writable: true});
    }
    else this.index_ = 0;
  }

  if (this.index_ < this.length)
    return {value: this[this.index_++], done: false};

  delete this.index_;
  return {value: undefined, done: true};
}

//if (Object.defineProperty) {
//  Object.defineProperty(Array.prototype, 'next', { value: Array_next,
//    enumerable: false, configurable: true, writable: true});
//} else
Array.prototype.next = Array_next;
;

var arr = [11, 22, 33];
console.log(inspect(arr, {colors: true}));

console.log('----');
for (var i of arr) console.log(i);
console.log(inspect(arr, {colors: true}));

console.log('----');
for (var i of arr) console.log(i);
console.log(inspect(arr, {colors: true}));

console.log('----');
for (var i of [111, 222, 333]) console.log(i);

console.log('----');
for (var i of [1111, 2222, 3333]) console.log(i);

