/**
 * Utils for working with the DOM
 */

const { $, $$ } = require('./selectors');
const { accessibleName, accessibleDescription } = require('./name');
const cssEscape = require('./cssEscape');
const hidden = require('./hidden');
const observe = require('./observe');

exports.$ = $;
exports.$$ = $$;
exports.accessibleName = accessibleName;
exports.accessibleDescription = accessibleDescription;
exports.cssEscape = cssEscape;
exports.hidden = hidden;
exports.observe = observe;
