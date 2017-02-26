/**
 * Entry point for standalone autorunning linter
 */
const Linter = require('./linter');

let config = window.accessibilityLinterConfig;
if (!config) {
  const scriptElement = document.currentScript;
  if (scriptElement) {
    const settings = scriptElement.textContent.trim();
    if (settings) {
      config = JSON.parse(settings);
    }
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

window.AccessibilityLinter = Linter;
window.accessibilityLinter = linter;
