import Rule from '../../rule';

export default class extends Rule {
  get selector() {
    return 'button,input:not([type=hidden]),meter,output,progress,select,textarea';
  }

  test(el) {
    if (el.labels.length > 1) {
      return 'control should not have multiple labels';
    }
    return null;
  }
}

