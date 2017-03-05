const { $, $$ } = require('./selectors');
const { accessibleName, accessibleDescription } = require('./name');
const aria = require('./aria');
const Contrast = require('./contrast');
const cssEscape = require('./cssEscape');
const HiddenCache = require('./hidden-cache');
const StyleCache = require('./style-cache');

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
  constructor() {
    this.styleCache = new StyleCache();
    this.hiddenCache = new HiddenCache(this.styleCache);
    this.nameCache = new WeakMap();
    this.descriptionCache = new WeakMap();
    this.contrast = new Contrast(this.styleCache);
  }

  hidden(el, options) {
    return this.hiddenCache.get(el, options);
  }

  style(el, name, pseudo) {
    return this.styleCache.get(el, name, pseudo);
  }

  accessibleName(el) {
    return getOrSet(
      this.nameCache,
      el,
      () => accessibleName(el, Object.assign({ utils: this }))
    );
  }

  accessibleDescription(el) {
    return getOrSet(
      this.nameCache,
      el,
      () => accessibleDescription(el, Object.assign({ utils: this }))
    );
  }
};

Utils.prototype.$ = $;
Utils.prototype.$$ = $$;
Utils.prototype.aria = aria;
Utils.prototype.cssEscape = cssEscape;

module.exports = Utils;
