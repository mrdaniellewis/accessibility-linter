(function () {
  // -------------------------------------
  // Make before/after names more explicit
  // -------------------------------------
  window.beforeAll = before;
  window.afterAll = after;
  window.before = () => { throw new Error('use `beforeAll`'); };
  window.after = () => { throw new Error('use `afterAll`'); };

  // -------------------------------------
  // A test logger that just saves the log messages
  // -------------------------------------
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

  // -------------------------------------
  // Custom assertions
  // -------------------------------------
  expect.extend({
    // Test logger to have no entries
    toNotHaveEntries() {
      expect.assert(
        this.actual.errors.length === 0 && this.actual.warnings.length === 0,
        'expected %s to have no logged entries',
        this.actual.errors
      );
      return this;
    },

    // Test logger to have errors
    toHaveErrors() {
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

    // Test logger to have warnings
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

    // Like toEqual, but tells you what is wrong
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

    // Matches the arguments in each call made to a spy
    toHaveHadCalls() {
      expect(this.actual.calls.map(call => call.arguments)).toEqual(Array.from(arguments));
      return this;
    },
  });

  // -------------------------------------
  // Turn a timeout into a promise
  // -------------------------------------
  window.afterTimeout = fn => new Promise(resolve => resolve(fn()));

  // -------------------------------------
  // Ensure each test has assertions
  // -------------------------------------
  let hasAssertions = false;
  const originalExpect = expect;
  Object.defineProperty(window, 'expect', {
    get() {
      hasAssertions = true;
      return originalExpect;
    },
    enumerable: true,
  });

  beforeEach(() => {
    hasAssertions = false;
  });

  afterEach(function () {
    if (!hasAssertions) {
      this.test.error(new Error('test has no assertions'));
    }
  });

  // -------------------------------------
  // Clean up spies
  // -------------------------------------
  afterEach(() => {
    expect.restoreSpies();
  });

  // -------------------------------------
  // Clean up created elements between tests
  // -------------------------------------
  window.whenDomUpdates = null;
  window.clean = (context = () => window) => {
    let cleaner;

    beforeAll(() => {
      cleaner = context().domCleaner({ exclude: '#mocha *' });
    });

    beforeEach(() => {
      window.whenDomUpdates = function (fn) {
        return new Promise(resolve => cleaner.onUpdate(resolve))
          .then(fn);
      };
    });

    afterEach(() => {
      window.whenDomUpdates = null;
      return Promise.resolve().then(() => cleaner.clean());
    });

    afterAll(() => {
      cleaner.stop();
    });
  };

  // -------------------------------------
  // Swap an object property for the duration of a test
  //
  // proxy(fn => fn(object, propertyName, newValue));
  //
  // -------------------------------------
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

  // -------------------------------------
  // Asynchronously load scripts and tests
  // -------------------------------------
  window.requireScript = function (url) {
    return fetch(url)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(`${url} returned ${response.status}`);
      });
  };

  window.requireModule = function (url) {
    const module = { exports: {} };
    return requireScript(url)
      .then((content) => {
        // eslint-disable-next-line no-new-func
        new Function('module', 'exports', content)(module, module.exports);
        return module.exports;
      });
  };

  window.loadingTests = [];
  Mocha.Suite.prototype.requireTests = function requireTests(url, run) {
    run = run || (content => new Function(content)()); // eslint-disable-line no-new-func

    const loading = requireScript(url)
      .then((content) => {
        const stack = [this];
        const hooks = ['beforeAll', 'beforeEach', 'afterAll', 'afterEach', 'describe', 'context', 'it'];
        const oldHooks = {};
        hooks.forEach(name => (oldHooks[name] = window[name]));

        window.describe = window.context = (title, fn) => {
          const block = new Mocha.Suite(title);
          stack[0].addSuite(block);
          stack.unshift(block);
          fn();
          stack.shift();
        };

        window.it = (title, fn) => {
          stack[0].addTest(new Mocha.Test(title, fn));
        };

        ['beforeAll', 'beforeEach', 'afterAll', 'afterEach'].forEach((name) => {
          window[name] = fn => stack[0][name](fn);
        });

        run(content);

        hooks.forEach(name => (oldHooks[name] = oldHooks[name]));
      })
      .catch((e) => {
        this.beforeAll(() => {
          throw new Error(`cannot load ${url}: ${e}`);
        });
      });

    window.loadingTests.push(loading);
  };
}());
