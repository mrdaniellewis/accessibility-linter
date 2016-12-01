({
  message: 'unknown element',
  selector: Object.keys(elements).map(name => `:not(${name})`).join(''),
});
