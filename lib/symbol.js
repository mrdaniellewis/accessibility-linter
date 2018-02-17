const namespace = 'accessibility-linter';
const cache = new Map();
const get = name => cache.get(name) || cache.set(name, Symbol(`${namespace}-${name}`)).get(name);
const create = new Proxy({}, { get: (target, property) => get(property) });

export default create;
