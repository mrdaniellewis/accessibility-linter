/* eslint-disable no-console */
module.exports = class Logger {
  message(message, el) {
    if (typeof message === 'string') {
      return message;
    }
    return message(el);
  }

  error(test, el) {
    console.error(this.message(test.message, el), el);
  }
};
