(function () {
  // Run an assertion after a DOM modification has completed
  // Remove any DOM modifications once completed
  // Usage
  // it('does stuff', when(() => change DOM...).then(() => run tests...))
  window.when = function when(setup, global = window) {
    return {
      setup,

      global,

      additions: [],

      then(test) {
        this.test = test;
        return this.run.bind(this);
      },

      cleanUp() {
        this.additions.splice(0).forEach(el => el.remove());
      },

      run() {
        const promise = new Promise(resolve => {
          const observer = new MutationObserver(mutations => {
            observer.disconnect();
            mutations.forEach(
              mutation => mutation.addedNodes.forEach(
                node => this.additions.push(node)
              )
            );
            resolve(mutations);
          });
          observer.observe(global.document, { subtree: true, childList: true });
          this.setup();
        });

        return promise
          .then(this.test)
          .then(
            () => this.cleanUp(),
            e => {
              this.cleanUp();
              return Promise.reject(e);
            }
          );
      },
    };
  };

  // A test logger that just saves the log messages
  window.TestLogger = class {
    constructor() {
      this.clear();
    }

    error() {
      this.errors.push(Array.from(arguments));
    }

    warn() {
      this.warnings.push(Array.from(arguments));
    }

    clear() {
      this.errors = [];
      this.warnings = [];
    }
  };

  // Assertions for the logger
  expect.extend({
    toNotHaveEntries() {
      expect.assert(
        this.actual.errors.length === 0,
        'expected %s to have no logged entries',
        this.actual.errors
      );
      return this;
    },

    toHaveEntries() {
      if (arguments.length === 0) {
        expect.assert(
          this.actual.errors.length > 0,
          'expected %s to have logged entries',
          this.actual.errors.length
        );
        return this;
      }
      expect(this.actual.errors).toEqual(Array.from(arguments));
      return this;
    },

    toGenerateErrorMessage(error) {
      const test = this.actual;
      const message = test.message;
      expect(message).toEqual(error);
      return this;
    },
  });
}());
