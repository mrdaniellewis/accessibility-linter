import XpathRule from '../xpath-rule';

export default class extends XpathRule {
  get selector() {
    return "text()[contains(.,'\xA0\xA0') or contains(normalize-space(),'\xA0 \xA0')]";
  }

  get message() {
    return 'no consecutive non-breaking spaces';
  }
}