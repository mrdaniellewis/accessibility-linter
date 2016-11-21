/* eslint-disable no-console */
module.exports = class Logger {
  constructor(docLink) {
    this.docLink = docLink;
  }

  error(rule, el) {
    console.error.apply(console, this.message(rule, el));
  }

  warn(rule, el) {
    console.warn.apply(console, this.message(rule, el));
  }

  message(rule, el) {
    return [
      typeof rule.message === 'function' ? rule.message(el) : rule.message,
      el,
      this.getLink(rule),
    ].filter(Boolean);
  }

  getLink(rule) {
    if (!this.docLink || !rule.doc) {
      return null;
    }

    return `${this.docLink}#${rule.doc}`;
  }
};
