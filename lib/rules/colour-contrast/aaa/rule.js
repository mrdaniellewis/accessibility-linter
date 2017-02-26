const ColourContrastAARule = require('../aa/rule.js');

module.exports = class extends ColourContrastAARule {
  setDefaults() {
    this.min = 7;
    this.minLarge = 4.5;
    this.type = 'warning';
    this.enabled = false;
  }
};
