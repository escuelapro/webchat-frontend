import history from 'utils/history';

describe('history', () => {
  it('exports a history object compatible with history API', () => {
    expect(history).toBeDefined();
    expect(typeof history.push).toBe('function');
    expect(typeof history.listen).toBe('function');
    expect(history.location).toBeDefined();
  });
});
