import XpathRule from '../xpath-rule';

export default class extends XpathRule {
  get selector() {
    return "text[contains(.,'\xA0\xA0')|contains(.,'\xA0 \xA0')]";
  }

  message() {
    return 'no consecutive non-breaking spaces';
  }
}
