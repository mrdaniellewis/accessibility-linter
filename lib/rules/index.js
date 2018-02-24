const context = require.context('.', true, /\/rule\.js$/);
const extractName = /^\.\/(.*)\/rule.js$/;
const rules = new Set([...context.keys().map((key) => {
  const Rule = context(key);
  [, Rule.name] = extractName.exec(key);
  return Rule;
})]);

export default rules;
