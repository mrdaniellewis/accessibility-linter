const Rule = require('../../rule.js');

module.exports = class extends Rule {
  selector(utils) {
    return this._selector
      || (this._selector = utils.config.attributes.eventHandlerAttributes.map(name => `[${name}]`).join(','));
  }

  test(el, utils) {
    const handlers = Array.from(el.attributes)
      .filter(({ name }) => utils.config.attributes.eventHandlerAttributes.includes(name))
      .map(({ name }) => name);

    return `do not use event handler attributes. Found: ${handlers.join(', ')}`;
  }
};

