const context = require.context('.', true, /\/rule\.js$/);
const extractName = /^\.\/(.*)\/rule.js$/;
const rules = context.keys().map((key) => {
  const Rule = context(key).default;
  Object.defineProperty(Rule, 'name', { value: extractName.exec(key)[1], writable: false });
  return Rule;
});

export default rules;
