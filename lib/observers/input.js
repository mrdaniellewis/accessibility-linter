class InputObserver {
  constructor(callback) {
    this.callback = callback;
    this.hacked = new Map();
  }

  observe(element) {
    this.element = element;
    this.hackPrototypes();
  }

  disconnect() {
    this.restoreAll();
  }

  trigger(node) {
    if (node instanceof HTMLOptionElement) {
      node = node.closest('select'); // eslint-disable-line no-param-reassign
      if (!node) {
        return;
      }
    }
    if (this.element.contains(node)) {
      this.callback([node === this.element ? node : node.parentNode]);
    }
  }

  hackPrototypes() {
    ['value', 'checked', 'indeterminate'].forEach(name => this.hack(HTMLInputElement, name));
    ['value'].forEach(name => this.hack(HTMLTextAreaElement, name));
    ['value', 'selectedIndex'].forEach(name => this.hack(HTMLSelectElement, name));
    ['selected'].forEach(name => this.hack(HTMLOptionElement, name));
  }

  hack({ prototype }, method) {
    const original = Object.getOwnPropertyDescriptor(prototype, method);
    const self = this;
    Object.defineProperty(prototype, method, Object.assign({}, original, {
      set(value) {
        original.set.call(this, value);
        self.trigger(this);
      },
    }));
    if (!this.hacked.has(prototype)) {
      this.hacked.set(prototype, new Set());
    }
    this.hacked.get(prototype).add([method, original]);
  }

  restoreAll() {
    this.hacked.forEach((set, proto) => (
      set.forEach(([method, descriptor]) => (
        Object.defineProperty(proto, method, descriptor)
      ))
    ));
    this.hacked.clear();
  }
}

export default InputObserver;
