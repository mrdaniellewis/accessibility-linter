import ariaExtensions from 'aria-extensions';
import AriaRule from '../aria-rule';

const { accessibleName, visible } = ariaExtensions.symbols;

export default class extends AriaRule {
  get selector() {
    return 'link';
  }

  get visibleOnly() {
    return true;
  }

  test(el) {
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
