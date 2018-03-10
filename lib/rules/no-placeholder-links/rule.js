import Rule from '../../rule';

export default class extends Rule {
  get selector() {
    return 'a:not([href])';
  }

  get message() {
    return 'no placeholder links';
  }
}
