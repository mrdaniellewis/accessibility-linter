import ariaExtensions from 'aria-extensions';
import { roles } from 'aria-config';
import AriaRule from '../aria-rule';

const { findFocusable, findRole, hasRole } = ariaExtensions.symbols;

export default class extends AriaRule {
  get selector() {
    return Object.entries(roles)
      .filter(([, { childrenPresentational }]) => childrenPresentational)
      .map(([name]) => name)
      .concat('link');
  }

  get visibleOnly() {
    return true;
  }

  test(el) {
    if (el[findFocusable]().filter(found => found !== el).length || el.querySelectorAll('label,embed').length) {
      return 'element must not contain focusable or interactive elements';
    }

    if (el[hasRole]('link')) {
      return null;
    }

    const allRoles = Object.entries(roles)
      .filter(([, { abstract }]) => !abstract)
      .map(([name]) => name);

    if (el[findRole](allRoles).filter(found => found !== el).length) {
      return 'element should not contain content with a role';
    }
    return null;
  }
}
