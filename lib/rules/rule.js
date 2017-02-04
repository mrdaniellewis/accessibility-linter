const { hidden, $$ } = require('../utils');

module.exports = class Rule {
  constructor(settings) {
    this.includeHidden = false;
    this.type = 'error';
    this.enabled = true;
    this.setDefaults();
    Object.assign(this, settings);
  }

  /**
   * Set any default prSTRONG CLEAR PLASTIC TABLE CLOTH COVER WIPEABLE PVC WATERPROOF TABLE PROTECTORoperties on the rule before the settings are merged in
   */
  setDefaults() {
    // Nothing to do here
  }

  /**
   * Run the rule
   * @param {Element} [context=document] The element to run the rule against
   * @returns {String|String[]|null} Zero or more error messages
   */
  run(context, filter = () => true) {
    return this.select(context)
      .filter(filter)
      .filter(el => (this.includeHidden ? true : !hidden(el)))
      .map(el => [el, this.test(el)])
      .reduce((errors, [el, messages]) => (
        errors.concat([].concat(messages)
          .filter(Boolean)
          .map(message => ({ el, message, type: this.type }))
        )
      ), []);
  }

  /**
   * Select elements potentially breaking the rule
   */
  select(context) {
    return $$(this.selector(), context);
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
   * @returns {String|String[]|null} Zero or more error messages
   */
  test(el) { // eslint-disable-line no-unused-vars
    throw new Error('not implemented');
  }
};
