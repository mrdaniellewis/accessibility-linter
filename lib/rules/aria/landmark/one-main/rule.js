const BannerRule = require('../one-banner/rule');

module.exports = class extends BannerRule {
  selector() {
    return 'main,[role~=main]';
  }

  get role() {
    return 'main';
  }
};
