import { symbols } from 'aria-extensions';
import AriaRule from '../aria-rule';

const { accessibleName, visible } = symbols;

export default class extends AriaRule {
  get selector() {
    return 'link';
  }

  test(el) {
    if (!el[visible]) {
      return null;
    }
    const links = this.select(document)
      .filter(link => link !== el && el[visible])
      .map(link => link[accessibleName])
      .filter(Boolean);

    if (links.includes(el[accessibleName])) {
      return 'no duplicate link names';
    }

    return null;
  }
}
