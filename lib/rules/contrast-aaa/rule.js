import ContrastAa from '../contrast-aa/rule';

export default class extends ContrastAa {
  constructor(options = {}) {
    super(Object.assign({ min: 7, minLarge: 4.5 }, options));
  }
}
