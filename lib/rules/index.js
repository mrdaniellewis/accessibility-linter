// The build process will generate a pre-built index of tests rather than using this file
/* eslint-disable global-require, import/no-dynamic-require */
module.exports = new Map(require('../build/utils').rules
  .map(path => [path, require(`./${path}/rule.js`)])
);
