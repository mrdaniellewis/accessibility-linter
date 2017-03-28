const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return '*';
  }

  test(el, utils) {
    const invalid = Array.from(el.attributes)
      .map(attr => attr.name)
      .filter(name => name.indexOf('aria-') === 0)
      .map(name => name.slice(5))
      .filter(name => !Object.keys(utils.config.ariaAttributes).includes(name));

    if (invalid.length) {
      return `element has unknown aria attribute${invalid.length > 1 ? 's' : ''}: ${invalid.map(name => `aria-${name}`).join(', ')}`;
    }

    return null;
  }
};
