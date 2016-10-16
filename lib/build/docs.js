/**
 * Build the docs
 *
 * Outputs a html document
 */
const marked = require('marked');
const highlight = require('highlight.js');
const { tests, readFile, toId } = require('./utils');

const header = readFile('../../docs/header.htm');
const footer = readFile('../../docs/footer.htm');

console.log(tests);

marked.setOptions({
  renderer: new marked.Renderer(),
  highlight(code) {
    return highlight.highlightAuto(code).value;
  },
});

const sectionStack = [];
const output = tests
  .map((test) => {
    if (!test.docPath) {
      return false;
    }

    const id = toId(test.docPath);
    if (sectionStack[0] === id) {
      return false;
    }

    let html = '';
    console.log(sectionStack, test);
    while (sectionStack.length >= test.depth) {
      html += '</section>';
      sectionStack.shift();
    }
    html += `<section id="${id}">\n${marked(readFile(test.docPath))}\n`;
    sectionStack.unshift(id);
    return html;
  })
  .filter(Boolean)
  .join('\n\n');

marked.setOptions({
  renderer: new marked.Renderer(),
  highlight(code) {
    return highlight.highlightAuto(code).value;
  },
});

process.stdout.write(`${header}\n${output}\n${footer}`);
