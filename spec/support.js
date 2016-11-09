(function () {
  // Run an assertion after a DOM modification has completed
  // Remove any DOM modifications once completed
  // Usage
  // it('does stuff', when(() => change DOM...).then(() => run tests...))
  window.when = function when(setup, global = window) {
    return {
      setup,

      global,

      then(test) {
        this.test = test;
        return this.run.bind(this);
      },

      run() {
        return new Promise((resolve) => {
          const observer = new MutationObserver((mutations) => {
            observer.disconnect();
            resolve(mutations);
          });
          observer.observe(global.document, { subtree: true, childList: true });
          this.setup();
        })
        .then(this.test);
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

    toGenerateErrorMessage(ob, error) {
      const test = this.actual;
      const expected = error || ob;
      let message;
      if (typeof test.message === 'function') {
        message = test.message(ob.for);
      } else {
        message = test.message;
      }
      expect(message).toEqual(expected);
      return this;
    },

    toEqualArray(array) {
      try {
        expect(this.actual).toEqual(array);
      } catch (e) {
        const missing = array.filter(item => !this.actual.includes(item));
        const additional = this.actual.filter(item => !array.includes(item));
        const parts = [
          missing.length ? `to include ${JSON.stringify(missing)}` : null,
          additional.length ? `not to include ${JSON.stringify(additional)}` : null,
        ];
        throw new Error(`Expected array ${parts.join(' and ')}`);
      }
      return this;
    },
  });
}());
