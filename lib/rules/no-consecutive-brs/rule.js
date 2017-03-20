const Rule = require('../rule');

function isBr(el) {
  return el instanceof Element && el.nodeName.toLowerCase() === 'br';
}

function previousElementIsBr(el, utils) {
  while ((el = el.previousSibling)) {
    if ((el instanceof Element && !utils.hidden(el)) || (el instanceof Text && el.data.trim())) {
      break;
    }
  }
  return isBr(el);
}

function nextElementIsBr(el, utils) {
  while ((el = el.nextSibling)) {
    if ((el instanceof Element && !utils.hidden(el)) || (el instanceof Text && el.data.trim())) {
      break;
    }
  }
  return isBr(el);
}

module.exports = class extends Rule {
  selector() {
    return 'br + br';
  }

  test(el, utils) {
    if (utils.hidden(el) || !previousElementIsBr(el, utils) || nextElementIsBr(el, utils)) {
      return null;
    }

    return 'do not use <br>s for spacing';
  }
};
