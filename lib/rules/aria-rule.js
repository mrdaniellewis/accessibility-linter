import ariaExtensions from 'aria-extensions';
import Rule from '../rule';
import { ExtendedArray } from '../utils';

const { findRole } = ariaExtensions.symbols;

export default class AriaRule extends Rule {
  select(context) {
    const target = context === document ? document.documentElement : context;
    return ExtendedArray.from(target[findRole](this.selector));
  }
}
