/* eslint-disable no-console, class-methods-use-this */
module.exports = class Logger {
  log({ type, el, message, name }) {
    console[type].apply(console, [message, el, name].filter(Boolean));
  }
};
