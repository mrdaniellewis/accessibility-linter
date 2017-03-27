const { $, $$ } = require('./selectors');
const { accessibleName, accessibleDescription } = require('./name');
const Aria = require('./aria');
const Contrast = require('./contrast');
const cssEscape = require('./cssEscape');
const Hidden = require('./hidden');
const Style = require('./style');

const getOrSet = (cache, el, setter) => {
  if (cache.has(el)) {
    return cache.get(el);
  }

  const value = setter();
  cache.set(el, value);
  return value;
};

/**
 * Helpers functions
 */
const Utils = class Utils {
  constructor(config) {
    this._style = new Style();
    this._hidden = new Hidden(this._style);
    this._nameCache = new WeakMap();
    this._descriptionCache = new WeakMap();
    this.contrast = new Contrast(this._style);
    this.config = config;
    this.aria = new Aria(config);
  }

  hidden(el, options) {
    return this._hidden.get(el, options);
  }

  style(el, name, pseudo) {
    return this._style.get(el, name, pseudo);
  }

  accessibleName(el) {
    return getOrSet(
      this._nameCache,
      el,
      () => accessibleName(el, Object.assign({ utils: this }))
    );
  }

  accessibleDescription(el) {
    return getOrSet(
      this._descriptionCache,
      el,
      () => accessibleDescription(el, Object.assign({ utils: this }))
    );
  }
};

Utils.prototype.$ = $;
Utils.prototype.$$ = $$;
Utils.prototype.cssEscape = cssEscape;

module.exports = Utils;
