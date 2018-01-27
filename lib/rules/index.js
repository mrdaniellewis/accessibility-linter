const context = require.context('.', true, /rule\.js$/);
const rules = new Map(context.keys().map(key => [key, context(key)]));

export default rules;
