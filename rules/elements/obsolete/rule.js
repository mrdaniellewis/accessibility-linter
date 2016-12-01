({
  message: 'do not use obsolete elements',
  selector: Object.keys(elements).filter(el => elements[el].obsolete).join(','),
});
