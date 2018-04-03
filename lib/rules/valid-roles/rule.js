import { roles } from 'aria-config';
import ariaExtensions from 'aria-extensions';
import Rule from '../../rule';
import { ExtendedArray, rSpace } from '../../utils';

const { aria } = ariaExtensions.symbols;

export default class extends Rule {
  get selector() {
    return '[role]';
  }

  test(el) {
    const roleAttribute = el.getAttribute('role').trim();
    if (!roleAttribute) {
      return 'role attribute should not be empty';
    }
    const errors = [];
    return ExtendedArray.from(roleAttribute.split(rSpace))
      .each((role) => {
        if (/[A-Z]/.test(role)) {
          errors.push(`role "${role}" should be lowercase`);
        }
      })
      .map(role => role.toLowerCase())
      .map((role) => {
        const ariaRole = roles[role];

        if (!ariaRole) {
          return `role "${role}" is not a known role`;
        }

        if (ariaRole.abstract) {
          return `role "${role}" is an abstract role and should not be used`;
        }

        const ariaData = el[aria];

        if (ariaData.implicit === role) {
          return `role "${role}" is implicit for this element and should not be specified`;
        }

        if (!ariaData.allowedRoles.includes(role)) {
          return `role "${role}" is not allowed on this element`;
        }

        return null;
      })
      .tap(foundErrors => foundErrors.unshift(...errors));
  }
}
