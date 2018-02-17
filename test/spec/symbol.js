describe('symbol', () => {
  const { symbol } = internals;

  it('generates symbols', () => {
    const { $foo } = symbol;

    expect(typeof $foo).toEqual('symbol');
    expect($foo.toString()).toEqual('Symbol(accessibility-linter-$foo)');
  });

  it('generated symbols are the same object', () => {
    expect(symbol.foo).toBe(symbol.foo);
  });
});
