import Mustache from 'mustache'; // eslint-disable-line import/no-extraneous-dependencies
import ruleDoc from './rules/rules.md';

const context = require.context('./rules', true, /doc\.md$/);
const extractName = /^\.\/(.*)\/doc.md$/;
const docs = context.keys().map(key => ({
  name: extractName.exec(key)[1],
  body: context(key),
}));

process.stdout.write(Mustache.render(ruleDoc, { docs, id() { return this.name; } }));
