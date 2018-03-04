/* eslint-disable no-console */

/**
 * A browser console reporter for mocha
 * See
 *  - https://github.com/mochajs/mocha/tree/master/lib/reporters/json.js
 *  - https://github.com/eeroan/WebConsole-reporter/blob/master/WebConsole.js
 */
window.ConsoleReporter = function ConsoleReporter(runner) {
  const table = [];
  const tests = [];
  const passes = [];
  const failures = [];
  const pending = [];

  function testName(test, joiner = ' - ') {
    let name = test.title;
    while ((test = test.parent) && !test.root) {
      name = `${test.title}${joiner}${name}`;
    }
    return name;
  }

  function updateCount() {
    const percent = 100 * ((passes.length + failures.length + pending.length) / runner.total);
    document.body.dataset.mochaPercent = Math.round(percent);
  }

  function tableRow(test) {
    return {
      Name: testName(test),
      State: test.state || 'pending',
      Link: new URL(`?grep=${testName(test, ' ')}`, window.location.href).href,
    };
  }

  function checkForDuplicateTestName(test) {
    const name = testName(test);
    if (tests.some(item => testName(item) === name)) {
      console.warn('Duplicate test name', name);
    }
  }

  runner.on('start', () => {
    document.body.classList.add('mocha-start');
  });

  runner.on('test', (test) => {
    checkForDuplicateTestName(test);
    tests.push(test);
  });

  runner.on('pending', (test) => {
    checkForDuplicateTestName(test);
    pending.push(test);
    console.warn(`pending: ${testName(test)}`);
    table.push(tableRow(test));
    updateCount();
  });

  runner.on('pass', (test) => {
    passes.push(test);
    table.push(tableRow(test));
    updateCount();
  });

  runner.on('fail', (test, e) => {
    console.error(testName(test), e);
    failures.push(test);
    table.push(tableRow(test));
    updateCount();
  });

  runner.on('end', () => {
    document.body.classList.remove('mocha-start');
    document.body.dataset.mochaPassed = passes.length;
    document.body.dataset.mochaFailed = failures.length;

    console.table(table);

    if (window.ConsoleReporter.windowError) {
      document.body.classList.add('mocha-finish-error');
      return;
    }

    if (!runner.total) {
      document.body.classList.add('mocha-finish-nothing');
      console.warn('0 specs run');
      return;
    }

    if (failures.length) {
      document.body.classList.add('mocha-finish-fail');
      console.log(`✓ ${passes.length} specs passed`);
      if (pending.length) {
        console.warn(`! ${pending.length} specs pending`);
      }
      console.error(`✖ ${failures.length} specs failed`);
      return;
    }

    document.body.classList.add('mocha-finish-pass');
    if (pending.length) {
      console.warn(`! ${pending.length} specs pending`);
    }
    console.log(`%c✓ ${passes.length} specs passed`, 'color: #00cb00');
  });
};

window.addEventListener('error', () => (window.ConsoleReporter.windowError = true));
