/* eslint-disable no-console */
module.exports = class Logger {
  constructor(docLink) {
    this.docLink = docLink;
  }

  error(test, el) {
    console.error.apply(console, this.message(test, el));
  }

  warn(test, el) {
    console.warn.apply(console, this.message(test, el));
  }

  message(test, el) {
    return [
      typeof test.message === 'function' ? test.message(el) : test.message,
      el,
      this.getLink(test),
    ].filter(Boolean);
  }

  getLink(test) {
    if (!this.docLink || !test.doc) {
      return null;
    }

    return `${this.docLink}#${test.doc}`;
  }
};
