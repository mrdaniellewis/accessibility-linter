const context = require.context('.', true, /spec\.js$/);
const extractName = /^\.\/(.*)\/spec.js$/;
const specs = new Map(context.keys().map(key => [extractName.exec(key)[1], context(key)]));

export default specs;
