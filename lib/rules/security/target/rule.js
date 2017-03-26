const Rule = require('../../rule');
const constants = require('../../../support/constants');

module.exports = class extends Rule {
  selector() {
    return 'a[href][target],area[href][target],form[target],base[target],form button[type=submit][formtarget],form input[type=submit][formtarget],form input[type=image][formtarget]';
  }

  test(el, utils) {
    if (el.target === '_self' || el.formTarget === '_self') {
      return null;
    }
    const nodeName = el.nodeName.toLowerCase();
    if (nodeName !== 'base' && nodeName !== 'area' && utils.hidden(el)) {
      return null;
    }

    const rel = el.rel && el.rel.split(constants.rSpace);
    if (rel && rel.includes('noopener') && rel.includes('noreferrer')) {
      return null;
    }

    let url = el.href;
    if (nodeName === 'form') {
      url = el.action;
    } else if (nodeName === 'button' || nodeName === 'input') {
      // Chrome returns the page url for el.formaction
      url = el.getAttribute('formaction') || el.form.action;
    }

    try {
      url = new URL(url, location.href);
    } catch (_) {
      url = null;
    }

    if (url && url.host === location.host) {
      return null;
    }

    let message = 'target attribute has opener vulnerability';
    if (nodeName === 'a' || nodeName === 'area') {
      message += '. Add `rel="noopener noreferrer"`';
    }
    return message;
  }
};
