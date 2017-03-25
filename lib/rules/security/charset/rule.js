const Rule = require('../../rule');

module.exports = class extends Rule {
  run(context, filter = () => true, utils) {
    const errors = [];

    if (!context.contains(document.documentElement)) {
      return [];
    }

    if (document.characterSet !== 'UTF-8') {
      errors.push({ el: document.documentElement, message: 'all HTML documents should be authored in UTF-8' });
    }

    const meta = utils.$$('meta[charset],meta[http-equiv="content-type" i]');

    if (meta.length > 1) {
      meta.forEach(el => errors.push({ el, message: 'more than one meta charset tag found' }));
    }

    if (!meta.length) {
      errors.push({ el: document.head, message: 'missing `<meta charset="UTF-8">`' });
    }

    meta
      .filter(el => el.httpEquiv)
      .forEach(el => errors.push({ el, message: 'use the form `<meta charset="UTF-8">`' }));

    meta
      .filter(el => document.head.firstElementChild !== el)
      .forEach(el => errors.push({ el, message: 'meta charset should be the first child of <head>' }));

    return errors.filter(({ el }) => filter(el));
  }
};
