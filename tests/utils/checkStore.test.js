import checkStore from 'utils/checkStore';

function createValidStore(overrides = {}) {
  return {
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    getState: jest.fn(),
    replaceReducer: jest.fn(),
    runSaga: jest.fn(),
    injectedReducers: {},
    injectedSagas: {},
    ...overrides,
  };
}

describe('checkStore', () => {
  it('does not throw for a valid redux store shape', () => {
    expect(() => checkStore(createValidStore())).not.toThrow();
  });

  it('throws when store is missing required methods', () => {
    const invalidStore = createValidStore({runSaga: undefined});

    expect(() => checkStore(invalidStore)).toThrow(
      '(app/utils...) injectors: Expected a valid redux store',
    );
  });

  it('throws when injectedReducers is not an object', () => {
    const invalidStore = createValidStore({injectedReducers: null});

    expect(() => checkStore(invalidStore)).toThrow(
      '(app/utils...) injectors: Expected a valid redux store',
    );
  });
});
