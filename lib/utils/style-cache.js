/**
 * A cache of computed style properties
 */
/* eslint-disable class-methods-use-this */
const Cache = require('./cache');

function getStyle(el, name, pseudo) {
  return window.getComputedStyle(el, pseudo ? `::${pseudo}` : null)[name];
}

module.exports = class StyleCache extends Cache {
  key(el, name, pseudo) {
    return `${name}~${pseudo}`;
  }

  setter(el, name, pseudo) {
    return getStyle(el, name, pseudo);
  }
};
