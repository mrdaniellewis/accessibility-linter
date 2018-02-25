import Rule from '../rule';
import { ExtendedArray } from '../utils';

export default class XPathRule extends Rule {
  select(context) {
    const results = document.evaluate(`./descendant-or-self::${this.selector}`, context);
    const found = new ExtendedArray();
    let result;
    while ((result = results.iterateNext())) {
      if (result.nodeType === Node.TEXT_NODE) {
        result = result.parentNode;
      }
      found.push(result);
    }
    return found;
  }
}
