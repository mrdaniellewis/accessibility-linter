const ExtendedArray = require('../utils/extended-array');

module.exports = class Rule {
  constructor(settings) {
    this.includeHidden = false;
    this.type = 'error';
    this.enabled = true;
    this.setDefaults();
    Object.assign(this, settings);
  }

  /**
   * Set any default properties on the rule before the settings are merged in
   */
  setDefaults() {
    // Nothing to do here
  }

  /**
   * Run the rule
   * @param {Element} [context=document] The element to run the rule against
   * @param {Function} filter A filter to remove elements that don't need to be tested
   * @param {Object} caches Utility caches
   * @returns {String|String[]|null} Zero or more error messages
   */
  run(context, filter = () => true, utils) {
    return this.select(context, utils)
      .filter(filter)
      .filter(el => (this.includeHidden ? true : !utils.hidden(el)))
      .map(el => (
        ExtendedArray.of(this.test(el, utils))
          .flatten()
          .compact()
          .map(message => ({ el, message, type: this.type }))
      ))
      .flatten();
  }

  /**
   * Select elements potentially breaking the rule
   */
  select(context, utils) {
    return utils.$$(this.selector(), context);
  }

  /**
   * The selector to select invalid elements
   */
  selector() { // eslint-disable-line class-methods-use-this
    throw new Error('not implemented');
  }

  /**
   * Test if an element is invalid
   * @param {Element} el The element to test
   * @param {Object} utils Utilities
   * @returns {String|String[]|null} Zero or more error messages
   */
  test(el, utils) { // eslint-disable-line no-unused-vars
    throw new Error('not implemented');
  }
};
