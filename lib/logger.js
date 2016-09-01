/* eslint-disable no-console */
module.exports = class Logger {
  error(test, el) {
    console.error(test.name, el, test.docHref);
  }
};
