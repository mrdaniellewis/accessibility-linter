import Rule from '../../rule';

export default class extends Rule {
  get selector() {
    return 'foo';
  }

  get message() {
    return 'do not use the <foo> element';
  }
}
