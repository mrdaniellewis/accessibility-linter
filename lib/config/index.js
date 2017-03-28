const allowedAria = require('./allowed-aria');
const ariaAttributes = require('./aria-attributes');
const elements = require('./elements');
const attributes = require('./event-handler-attributes');
const roles = require('./roles');

function extendElements(original, config) {
  const settings = Object.assign({}, original);
  if (config) {
    Object.entries(config).forEach(([key, value]) => {
      if (!value) {
        delete settings[key];
        return;
      }
      settings[key] = Object.assign({}, settings[key] || {}, value);
    });
  }
  return settings;
}

module.exports = class Config {
  constructor(settings = {}) {
    this.allowedAria = allowedAria;
    this.ariaAttributes = ariaAttributes;
    this.elements = extendElements(elements, settings.elements);
    this.attributes = attributes;
    this.roles = roles;
  }
};
