import Rule from '../../rule';

export default class extends Rule {
  get selector() {
    return 'button:not([type])';
  }

  get message() {
    return '<button> must have a type attribute';
  }
}
