/**
 * Utils to make writing tests easier
 */
(function () {
  // Generate a unique id
  let idCount = 0;
  window.uniqueId = () => `unique-id-${++idCount}`;

  // Append html to the body and return the first element
  window.appendToBody = html => $(html).appendTo('body')[0];
}());
