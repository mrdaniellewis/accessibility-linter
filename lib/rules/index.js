const context = require.context('.', true, /\/rule\.js$/);
const extractName = /^\.\/(.*)\/rule.js$/;
const rules = new Map([...context.keys().map((key) => {
  const Rule = context(key).default;
  return [extractName.exec(key)[1], Rule];
})]);

export default rules;
