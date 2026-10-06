const path = require('node:path');
module.exports = {process(_source, filename) {return {code:'module.exports = '+JSON.stringify('/declared/module/'+path.basename(filename))+';'};}};
