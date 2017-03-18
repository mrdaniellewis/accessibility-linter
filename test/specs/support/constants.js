describe('constants', () => {
  let constants;

  beforeAll(() => (
    requireModule('../lib/support/constants.js')
      .then(ob => (constants = ob))
  ));

  describe('#rSpace', () => {
    it('is a regular expression matching spaces', () => {
      expect(constants.rSpace).toBeA(RegExp);
      expect(constants.rSpace.toString()).toEqual('/[ \\t\\n\\f\\r]+/');
    });
  });
});
