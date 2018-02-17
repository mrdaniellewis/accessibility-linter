class DomObserver {
  constructor(callback) {
    this.callback = callback;
  }

  childListEmptyChange(record) {
    return record.target.childNodes.length === 0 ||
      record.addedNodes.length === record.target.childNodes.length;
  }

  characterDataEmptyChange(record) {
    return record.target.parentNode.childNodes.length === 1 &&
      (record.oldValue === '' || record.target.data === '');
  }

  observe(element) {
    this.observer = new MutationObserver(mutations => (
      this.callback(mutations
        .map((record) => {
          let node = record.target;
          if (node === element) {
            return element;
          }
          if (record.type === 'characterData' && this.characterDataEmptyChange(record)) {
            return node.parentNode === element ? node.parentNode : node.parentNode.parentNode;
          } else if (record.type !== 'childList' || this.childListEmptyChange(record)) {
            node = node.parentNode;
          }
          return node;
        }))
    ));
    this.observer.observe(
      element,
      {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
        characterDataOldValue: true,
      },
    );
  }

  disconnect() {
    this.observer.disconnect();
  }
}

export default DomObserver;
