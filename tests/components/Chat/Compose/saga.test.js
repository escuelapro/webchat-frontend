import saga from 'components/Chat/Compose/saga';

describe('Compose saga', () => {
  it('is an empty generator', () => {
    const gen = saga();
    expect(gen.next().done).toBe(true);
  });
});
