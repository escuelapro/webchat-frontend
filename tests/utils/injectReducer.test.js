import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {ReactReduxContext} from 'react-redux';

import injectReducer, {useInjectReducer} from 'utils/injectReducer';

function createFakeStore() {
  return {
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    getState: jest.fn(),
    replaceReducer: jest.fn(),
    runSaga: jest.fn(),
    injectedReducers: {},
    injectedSagas: {},
  };
}

describe('injectReducer HOC', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('injects reducer on constructor using ReactReduxContext.store', () => {
    process.env.NODE_ENV = 'test';

    const store = createFakeStore();
    const reducer = (state = {}) => state;

    const Dummy = () => <div />;
    const Enhanced = injectReducer({key: 'chat', reducer})(Dummy);

    renderer.create(
      <ReactReduxContext.Provider value={{store}}>
        <Enhanced />
      </ReactReduxContext.Provider>,
    );

    expect(store.replaceReducer).toHaveBeenCalledTimes(1);
    expect(typeof store.injectedReducers.chat).toBe('function');
  });

  it('injects reducer via useInjectReducer hook', () => {
    process.env.NODE_ENV = 'test';

    const store = createFakeStore();
    const reducer = (state = {}) => state;

    function HookComponent() {
      useInjectReducer({key: 'chat', reducer});
      return <div />;
    }

    act(() => {
      renderer.create(
        <ReactReduxContext.Provider value={{store}}>
          <HookComponent />
        </ReactReduxContext.Provider>,
      );
    });

    expect(store.replaceReducer).toHaveBeenCalledTimes(1);
    expect(typeof store.injectedReducers.chat).toBe('function');
  });
});
