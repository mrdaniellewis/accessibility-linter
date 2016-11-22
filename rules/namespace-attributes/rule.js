({
  message: (el) => {
    const names = ['data', 'data-', 'aria', 'aria-'].filter(name => el.hasAttribute(name));
    return `invalid attribute${names.length > 1 ? 's' : ''}: ${names.join(', ')}`;
  },
  selector: '[data],[data-],[aria],[aria-]',
});
