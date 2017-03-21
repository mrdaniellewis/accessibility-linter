const FieldsetRule = require('../fieldset-and-legend/rule');

module.exports = class extends FieldsetRule {
  get parent() {
    return 'details';
  }

  get child() {
    return 'summary';
  }

  isHidden(el, utils) {
    // summary will be hidden if details is not open
    return el.nodeName.toLowerCase() !== 'summary' && utils.hidden(el);
  }
};
