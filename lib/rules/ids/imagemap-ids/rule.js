const Rule = require('../../rule');
const { rSpace } = require('../../../support/constants');

module.exports = class extends Rule {
  selector() {
    return 'map';
  }

  test(el, utils) {
    if (!el.name) {
      return 'name attribute is required';
    }

    if (rSpace.test(el.name)) {
      return 'name attribute must not contain spaces';
    }

    const name = el.name.toLowerCase();
    const mapNames = utils.$$('map[name]').map(map => map.name.toLowerCase());
    if (mapNames.filter(item => item === name).length > 1) {
      return 'name attribute must be case-insensitively unique';
    }

    const imgUseMaps = utils.$$('img[usemap]').map(img => img.useMap.toLowerCase());
    if (!imgUseMaps.includes(`#${name}`)) {
      return 'name attribute should be referenced by an img usemap attribute';
    }

    if (el.id && el.id !== el.name) {
      return 'if the id attribute is present it must equal the name attribute';
    }

    return null;
  }
};
