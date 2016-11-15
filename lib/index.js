/**
 * Entry point for standalone autorunning linter
 */
const Linter = require('./linter');

const config = window.accessibilityLinterConfig || {};
const scriptElement = document.currentScript;
if (scriptElement) {
  eval(`!function(){${scriptElement.textContent}}()`); // eslint-disable-line no-eval
  if (!('whitelist' in config)) {
    config.whitelist = scriptElement.dataset.whitelist;
  }
}

const linter = new Linter(config);
const start = () => {
  linter.run();
  linter.observe();
};

if (/^(:?interactive|complete)$/.test(document.readyState)) {
  // Document already loaded
  start();
} else {
  document.addEventListener('DOMContentLoaded', start);
}

module.exports = linter;
