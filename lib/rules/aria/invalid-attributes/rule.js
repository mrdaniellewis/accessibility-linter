const Rule = require('../../rule');
const config = require('../../../config');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return '*';
  }

  test(el) {
    const invalid = Array.from(el.attributes)
      .map(attr => attr.name)
      .filter(name => name.indexOf('aria-') === 0)
      .map(name => name.slice(5))
      .filter(name => !Object.keys(config.ariaAttributes).includes(name));

    if (invalid.length) {
      return `element has unknown aria attribute${invalid.length > 1 ? 's' : ''}: ${invalid.map(name => `aria-${name}`).join(', ')}`;
    }

    return null;
  }
};
