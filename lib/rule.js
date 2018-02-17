import { $$, ExtendedArray } from './utils';

class Rule {
  constructor({ name, selector, message, test, type = 'error', whitelist } = {}) {
    this.name = this.constructor.name !== 'Rule' ? this.constructor.name : name;
    if (!this.name) {
      throw new TypeError('rule must have a name');
    }
    if (!this.selector) {
      this.selector = selector;
    }
    this.test = this.test || test || (() => message);
    if (!this.message) {
      this.message = message;
    }
    this.type = type;
    this.whitelist = whitelist;
  }

  run(context, filter) {
    return $$(this.selector, context)
      .filter(filter)
      .map(element => (
        ExtendedArray
          .from([this.test(element)])
          .flatten()
          .compact()
          .map(message => ({ element, message }))
      ))
      .flatten();
  }
}

export default Rule;
