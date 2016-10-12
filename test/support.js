(function () {
  // Assertions for the logger
  expect.extend({
    toNotHaveEntries() {
      expect.assert(
        this.actual.errors.length === 0,
        'expected %s to have no logged entries',
        this.actual.errors
      );
      return this;
    },

    toHaveEntries() {
      if (arguments.length === 0) {
        expect.assert(
          this.actual.errors.length > 0,
          'expected %s to have logged entries',
          this.actual.errors.length
        );
        return this;
      }
      expect(this.actual.errors).toEqual(Array.from(arguments));
      return this;
    },

    toGenerateErrorMessage(error) {
      const test = this.actual;
      const message = test.message;
      expect(message).toEqual(error);
      return this;
    },
  });
}());
