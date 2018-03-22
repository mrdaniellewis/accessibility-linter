import ariaExtensions from 'aria-extensions';
import { ExtendedArray } from './utils';
import symbol from './symbol';

const { $whitelist } = symbol;
const fakeMap = {
  set() { return this; },
  get() { return this; },
  has() { return false; },
  add() {},
};

class Runner {
  constructor({ rules, whitelist, attributeName, cache = true }) {
    this.rules = ExtendedArray.from(rules).filter(rule => rule.type !== 'off');
    this.whitelist = whitelist;
    this.attributeName = attributeName;
    this.matched = cache ? new WeakMap() : fakeMap;
  }

  run(...contexts) {
    const run = {};
    return ExtendedArray.from(contexts)
      .tap(() => ariaExtensions.startCaching())
      .map(context => (
        this.rules
          .tap(() => this.rules.forEach(rule => rule.setup(run)))
          .map(rule => (
            rule
              .run(context, el => this.filter(el, rule))
              .map(({ message, element }) => ({ message, element, rule }))
          ))
          .tap(() => this.rules.forEach(rule => rule.teardown(run)))
      ))
      .flatten()
      .tap(errors => errors.forEach(this.setMatched, this))
      .tap(() => ariaExtensions.stopCaching());
  }

  filter(element, rule) {
    const matched = this.matched.get(element);
    let filterOut = '';
    if (matched && (matched.has($whitelist) || matched.has(rule.name))) {
      return false;
    }

    if (element === document) {
      return true;
    }

    if (this.whitelist && element.matches(this.whitelist)) {
      filterOut = $whitelist;
    } else if (rule.whitelist && element.matches(rule.whitelist)) {
      filterOut = rule.name;
    } else if (this.attributeName && element.hasAttribute(this.attributeName)) {
      const attribute = element.getAttribute(this.attributeName);
      if (!attribute || attribute.split(/\s+/).includes(rule.name)) {
        filterOut = rule.name;
      }
    }

    if (filterOut) {
      (matched || this.createMatched(element)).add(filterOut);
      return false;
    }

    return true;
  }

  createMatched(element) {
    return this.matched.set(element, new Set()).get(element);
  }

  setMatched({ element, rule }) {
    (this.matched.get(element) || this.createMatched(element)).add(rule.name);
  }
}

export default Runner;
