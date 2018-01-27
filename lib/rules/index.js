const context = require.context('.', true, /rule\.js$/);

const extractName = /^\.\/(.*)\/rule.js$/;
const rules = new Map(context.keys().map(key => [extractName.exec(key)[1], context(key)]));

export default rules;
