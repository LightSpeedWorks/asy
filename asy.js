this.asy = function () {
  var aa = require('aa');
  aa.sleep = aa.delay = aa.wait;

  if (typeof module === 'object' && module && module.exports)
    module.exports = aa;

  return aa;
}();
