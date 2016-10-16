/**
 * Build the bookmarklet
 */

const escapeHtml = require('escape-html');

let input = '';

function toBookmarklet() {
  return `<html>
  <style>
    pre {
      white-space: pre-wrap;
    } 
  </style>
  <pre>javascript:${escapeHtml(encodeURI(input))}</pre>`;
}

process.stdin
  .on('data', (data) => {
    input += data;
  })
  .on('end', () => {
    process.stdout.write(toBookmarklet());
  });
