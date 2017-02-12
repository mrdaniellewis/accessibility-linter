/* eslint-disable no-console, class-methods-use-this */
module.exports = class Logger {
  log({ type, el, message }) {
    console[type].apply(console, [message, el].filter(Boolean));
  }
};
