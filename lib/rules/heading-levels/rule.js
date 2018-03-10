import { symbols } from 'aria-extensions';
import AriaRule from '../aria-rule';

const { hasRole, visible } = symbols;

export default class extends AriaRule {
  get selector() {
    return 'heading';
  }

  getLevel(el) {
    return /h[1-6]/i.test(el.nodeName) ? +el.nodeName[1] : (+el.getAttribute('aria-level') || 2);
  }

  previous(el) {
    let cursor = el.previousElementSibling;
    while (cursor && cursor.lastElementChild) {
      cursor = cursor.lastElementChild;
    }
    return cursor;
  }

  test(el) {
    if (!el[symbols.visible]) {
      return null;
    }
    const level = this.getLevel(el);
    if (level === 1) {
      // Level one headings can never be incorrectly nested
      return null;
    }
    let cursor = el;
    do {
      cursor = this.previous(cursor) || cursor.parentElement;
      if (cursor && cursor[hasRole]('heading') && cursor[visible]) {
        const previousLevel = this.getLevel(cursor);
        if (level <= previousLevel + 1) {
          return null;
        }
        break;
      }
    } while (cursor && cursor !== document.body);
    return 'headings must be nested correctly';
  }
}
