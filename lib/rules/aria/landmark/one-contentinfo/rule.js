const BannerRule = require('../one-banner/rule');

module.exports = class extends BannerRule {
  selector() {
    return 'footer,[role~=contentinfo]';
  }

  get role() {
    return 'contentinfo';
  }
};
