import ariaExtensions from 'aria-extensions';
import { $$, ExtendedArray } from './utils';

const { ariaVisible, visible } = ariaExtensions.symbols;

class Rule {
  constructor({ name, selector, message, test, type = 'error', visibleOnly, whitelist } = {}) {
    this.name = this.constructor.name !== 'Rule' ? this.constructor.name : name;
    if (!this.name) {
      throw new TypeError('rule must have a name');
    }
    if (!this.selector) {
      this.selector = selector;
    }
    this.test = this.test || test || (() => this.message);
    if (!this.message) {
      this.message = message;
    }
    this.type = type;
    this.whitelist = whitelist;
    if (!('visibleOnly' in this)) {
      this.visibleOnly = visibleOnly;
    }
  }

  select(context) {
    return $$(this.selector, context);
  }

  setup() {}

  run(context, filter) {
    return this.select(context)
      .filter(filter)
      .filter((el) => {
        if (this.visibleOnly === 'aria') {
          return el[ariaVisible];
        }
        if (this.visibleOnly) {
          return el[visible];
        }
        return true;
      })
      .map(element => (
        ExtendedArray
          .from([this.test(element)])
          .flatten()
          .compact()
          .map(message => ({ element, message }))
      ))
      .flatten();
  }

  teardown() {}
}

export default Rule;
