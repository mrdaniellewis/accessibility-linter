const events = ['focus', 'blur', 'load', 'error', 'transitionend', 'transitioncancel', 'change', 'click', 'input'];

class EventObserver {
  constructor(callback) {
    this.callback = callback;
  }

  handleEvent({ target }) {
    this.callback([target === this.element ? this.element : target.parentNode]);
  }

  observe(element) {
    this.element = element;
    events.forEach(name => (
      element.addEventListener(name, this, { capture: true, passive: true })
    ));
  }

  disconnect() {
    events.forEach(name => (
      this.element.removeEventListener(name, this, { capture: true, passive: true })
    ));
  }
}

export default EventObserver;
