const Rule = require('../rule');

function getFirstChild(el) {
  let cursor = el.firstChild;
  while (cursor instanceof Text && !cursor.data.trim()) {
    cursor = cursor.nextSibling;
  }
  return cursor;
}

module.exports = class extends Rule {
  get parent() {
    return 'fieldset';
  }

  get child() {
    return 'legend';
  }

  isHidden(el, utils) {
    return utils.hidden(el);
  }

  selector() {
    return `${this.parent},${this.child}`;
  }

  test(el, utils) {
    if (this.isHidden(el, utils)) {
      return null;
    }

    if (el.nodeName.toLowerCase() === this.parent) {
      const firstChild = getFirstChild(el);
      if (firstChild
        && firstChild instanceof HTMLElement
        && firstChild.nodeName.toLowerCase() === this.child
        && !utils.hidden(firstChild)) {
        return null;
      }
      return `a <${this.parent}> must have a visible <${this.child}> as their first child`;
    }

    // Legend
    if (el.parentNode.nodeName.toLowerCase() === this.parent) {
      const firstChild = getFirstChild(el.parentNode);
      if (firstChild === el) {
        return null;
      }
    }
    return `a <${this.child}> must be the first child of a <${this.parent}>`;
  }
};
