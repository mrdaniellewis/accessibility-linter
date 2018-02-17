class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  handleEvent() {
    this.callback([this.element]);
  }

  observe(element) {
    this.element = element;
    window.addEventListener('resize', this);
  }

  disconnect() {
    window.removeEventListener('resize', this);
  }
}

export default ResizeObserver;
