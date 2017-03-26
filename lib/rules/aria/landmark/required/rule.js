const Rule = require('../../../rule.js');

function hasLandmark(nodeName, role, utils) {
  return utils.$$(`${nodeName},[role~=${role}]`, document.body)
    .filter(el => !utils.hidden(el))
    .filter(el => utils.aria.hasRole(el, role))
    .filter(el => utils.aria.closestRole(el, ['document', 'application']) === document.body)
    .filter(el => el.innerText)
    .length > 0;
}

module.exports = class extends Rule {
  selector() {
    return 'body';
  }

  test(el, utils) {
    const errors = [];

    if (!hasLandmark('main', 'main', utils)) {
      errors.push('document should have a <main>');
    }

    if (!hasLandmark('header', 'banner', utils)) {
      errors.push('document should have a <header>');
    }

    if (!hasLandmark('footer', 'contentinfo', utils)) {
      errors.push('document should have a <footer>');
    }

    return errors;
  }
};
