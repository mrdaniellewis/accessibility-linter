import Rule from '../../rule';

export default class extends Rule {
  get selector() {
    return 'br + br';
  }

  test(el) {
    if (this.hasAdjacentBr(el, 'nextSibling')) {
      // Error will be reported on next element
      return null;
    }

    if (!this.hasAdjacentBr(el, 'previousSibling')) {
      // Actually separated by text
      return null;
    }

    return 'no consecutive <br> elements';
  }

  hasAdjacentBr(el, method) {
    let node = el;
    while ((node = node[method])) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        return node.nodeName.toLowerCase() === 'br';
      }
      if (node.nodeType === Node.TEXT_NODE && node.data.replace(/\xA0/g, '').trim()) {
        return false;
      }
    }
    return false;
  }

  get message() {
    return 'no consecutive <br> elements';
  }
}
