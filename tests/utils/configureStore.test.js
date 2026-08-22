/* eslint-disable no-underscore-dangle */
import configureStore from 'utils/configureStore';

describe('configureStore', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalReduxDevtools =
    typeof window !== 'undefined'
      ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      : undefined;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (typeof window !== 'undefined') {
      window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ = originalReduxDevtools;
    }
  });

  it('creates store with runSaga and injection maps', () => {
    delete window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
    process.env.NODE_ENV = 'test';

    const store = configureStore();

    expect(store).toHaveProperty('runSaga');
    expect(typeof store.runSaga).toBe('function');
    expect(store.injectedReducers).toEqual({});
    expect(store.injectedSagas).toEqual({});
  });

  it('uses Redux DevTools compose when available in non-production', () => {
    process.env.NODE_ENV = 'development';
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ = jest.fn(
      () => (...enhancers) => enhancers[0],
    );

    const store = configureStore();

    expect(window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__).toHaveBeenCalled();
    expect(store).toHaveProperty('runSaga');
  });
});
