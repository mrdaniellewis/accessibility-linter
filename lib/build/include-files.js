'use strict';

class IncludeFiles {
  constructor(text) {
  }

  toTemplate(text) {
    const findTag = /\/\*\*(include|each|end)(?: ([^ *]+))? ?\*\*\//g;
    const template = [];
    const stack = [];
    let lastIndex = 0;
    let cursor = template;
    let match;
    while ((match = findTag(text))) {
      cursor.push(text.slice(lastIndex, match.index));
      lastIndex = findTag.lastIndex;

      const [, tag, value] = match;
      switch (tag) {
        case 'include':
          cursor.push({ fileName: value });
          break;
        case 'each':
          stack.push(cursor);
          cursor = [];
          template.push(cursor);
          break;
        case 'end':
          if (!stack.length) {
            throw new Error(`unbalanced each/end tags at ${match.index}`);
          }
          cursor = stack.pop();
          break;
        default:
          // Do nothing
      }
    }

    if (stack.length) {
      throw new Error('missing end tag');
    }

    cursor.push(text.slice(lastIndex));

    return template;
  }

  render(template, data) {
    return template.map(value => {
      if (Array.isArray(value)) {
        return this.render(value, data[value]);
      }

      if (value.fileName) {
        return this.include(value.fileName);
      }

      return value;
    }).join('');
  }
}

module.exports = function includeFiles(data) {
  return new IncludeFiles(data).output;
};
