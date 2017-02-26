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
          observer.observe(
            global.document,
            { subtree: true, childList: true, attributes: true, characterData: true }
          );
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

    log({ type, el, message }) {
      this[`${type}s`].push([message, el].filter(Boolean));
    }

    clear() {
      this.errors = [];
      this.warns = this.warnings = [];
    }
  };

  // Assertions for the logger
  expect.extend({
    toNotHaveEntries() {
      expect.assert(
        this.actual.errors.length === 0 && this.actual.warnings.length === 0,
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

    toHaveWarnings() {
      if (arguments.length === 0) {
        expect.assert(
          this.actual.warnings.length > 0,
          'expected %s to have logged entries',
          this.actual.warnings.length
        );
        return this;
      }
      expect(this.actual.warnings).toEqual(Array.from(arguments));
      return this;
    },

    toMatchArray(array) {
      try {
        expect(this.actual.sort()).toEqual(array.sort());
      } catch (e) {
        const missing = array.filter(item => !this.actual.includes(item));
        const additional = this.actual.filter(item => !array.includes(item));
        const parts = [
          missing.length ? `to include ${JSON.stringify(missing)}` : null,
          additional.length ? `not to include ${JSON.stringify(additional)}` : null,
        ].filter(Boolean);
        throw new Error(`Expected array ${parts.join(' and ')}`);
      }
      return this;
    },

    toHaveHadCalls() {
      expect(this.actual.calls.map(call => call.arguments)).toEqual(Array.from(arguments));
      return this;
    },
  });

  // Clean up created elements between tests
  window.clean = () => {
    let cleaner;

    before(() => {
      cleaner = domCleaner({ exclude: '#mocha *' });
    });

    afterEach(() => Promise.resolve().then(() => cleaner.clean()));

    after(() => {
      cleaner.stop();
    });
  };

  window.proxy = function (fn) {
    let ob, prop, originalValue;

    beforeEach(() => {
      fn((_ob, _prop, newValue) => {
        ob = _ob;
        prop = _prop;
        originalValue = ob[prop];
        ob[prop] = newValue;
      });
    });

    afterEach(() => {
      ob[prop] = originalValue;
    });
  };

  afterEach(() => {
    expect.restoreSpies();
  });
}());
