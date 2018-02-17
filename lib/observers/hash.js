class HashObserver {
  constructor(callback) {
    this.callback = callback;
  }

  handleEvent({ oldURL, newURL }) {
    this.findTarget(oldURL);
    this.findTarget(newURL);
  }

  findTarget(url) {
    if (!url) {
      return;
    }
    const id = new URL(url).hash.slice(1);
    if (!id) {
      return;
    }
    const target = document.getElementById(id);
    if (target && this.element.contains(target)) {
      this.callback([target === this.element ? target : target.parentNode]);
    }
  }

  observe(element) {
    this.element = element;
    window.addEventListener('hashchange', this);
  }

  disconnect() {
    window.removeEventListener('hashchange', this);
  }
}

export default HashObserver;
