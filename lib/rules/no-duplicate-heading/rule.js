import { symbols } from 'aria-extensions';
import NoDuplicateHeading from '../heading-levels/rule';

const { accessibleName, hasRole, visible } = symbols;

export default class extends NoDuplicateHeading {
  test(el) {
    if (!el[symbols.visible]) {
      return null;
    }
    const headings = [];
    const level = this.getLevel(el);
    let cursor = el;
    do {
      cursor = this.previous(cursor);
      if (cursor && cursor[hasRole]('heading') && cursor[visible]) {
        const currentLevel = this.getLevel(cursor);
        if (currentLevel < level) {
          break;
        }
        if (currentLevel === level) {
          headings.push(cursor);
        }
      }
    } while (cursor);

    if (headings.length) {
      const name = el[accessibleName];
      if (headings.map(heading => heading[accessibleName]).includes(name)) {
        return 'no duplicate heading names';
      }
    }

    return null;
  }
}
