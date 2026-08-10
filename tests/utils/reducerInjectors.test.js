import getInjectors, {injectReducerFactory} from 'utils/reducerInjectors';

function createStore(overrides = {}) {
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

describe('reducerInjectors', () => {
  let store;
  let reducer;

  beforeEach(() => {
    store = createStore();
    reducer = (state = {}) => state;
  });

  describe('injectReducerFactory', () => {
    it('injects reducer and replaces root reducer', () => {
      const injectReducer = injectReducerFactory(store, true);

      injectReducer('chat', reducer);

      expect(store.injectedReducers.chat).toBe(reducer);
      expect(store.replaceReducer).toHaveBeenCalledTimes(1);
      expect(typeof store.replaceReducer.mock.calls[0][0]).toBe('function');
    });

    it('skips replaceReducer when same key and reducer reference already injected', () => {
      const injectReducer = injectReducerFactory(store, true);
      store.injectedReducers.chat = reducer;

      injectReducer('chat', reducer);

      expect(store.replaceReducer).not.toHaveBeenCalled();
    });

    it('replaces reducer when key exists but reducer reference changed', () => {
      const injectReducer = injectReducerFactory(store, true);
      const oldReducer = (state = {}) => state;
      store.injectedReducers.chat = oldReducer;

      injectReducer('chat', reducer);

      expect(store.injectedReducers.chat).toBe(reducer);
      expect(store.replaceReducer).toHaveBeenCalledTimes(1);
    });

    it('validates store when isValid is false', () => {
      const invalidStore = createStore({runSaga: undefined});
      const injectReducer = injectReducerFactory(invalidStore, false);

      expect(() => injectReducer('chat', reducer)).toThrow(
        '(app/utils...) injectors: Expected a valid redux store',
      );
    });

    it('throws when key is empty', () => {
      const injectReducer = injectReducerFactory(store, true);

      expect(() => injectReducer('', reducer)).toThrow(
        '(app/utils...) injectReducer: Expected `reducer` to be a reducer function',
      );
    });

    it('throws when reducer is not a function', () => {
      const injectReducer = injectReducerFactory(store, true);

      expect(() => injectReducer('chat', 'not-a-reducer')).toThrow(
        '(app/utils...) injectReducer: Expected `reducer` to be a reducer function',
      );
    });
  });

  describe('getInjectors', () => {
    it('returns injectReducer bound to store', () => {
      const {injectReducer} = getInjectors(store);

      injectReducer('chat', reducer);

      expect(store.injectedReducers.chat).toBe(reducer);
      expect(store.replaceReducer).toHaveBeenCalledTimes(1);
    });

    it('throws when store is invalid', () => {
      expect(() => getInjectors(createStore({dispatch: undefined}))).toThrow(
        '(app/utils...) injectors: Expected a valid redux store',
      );
    });
  });
});
