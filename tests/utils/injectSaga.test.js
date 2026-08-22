import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {ReactReduxContext} from 'react-redux';

import injectSaga, {useInjectSaga} from 'utils/injectSaga';

function createFakeStore() {
  return {
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    getState: jest.fn(),
    replaceReducer: jest.fn(),
    runSaga: jest.fn(() => ({cancel: jest.fn()})),
    injectedReducers: {},
    injectedSagas: {},
  };
}

describe('injectSaga HOC', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('injects saga on constructor with component props args', () => {
    process.env.NODE_ENV = 'test';

    const store = createFakeStore();
    const saga = function* saga() {
      yield undefined;
    };

    const Dummy = () => <div />;
    const Enhanced = injectSaga({key: 'messages', saga})(Dummy);

    const props = {hello: 'world'};

    renderer.create(
      <ReactReduxContext.Provider value={{store}}>
        <Enhanced {...props} />
      </ReactReduxContext.Provider>,
    );

    expect(store.runSaga).toHaveBeenCalledTimes(1);
    expect(store.runSaga).toHaveBeenCalledWith(saga, props);
    expect(store.injectedSagas.messages).toBeDefined();
  });

  it('ejects saga on unmount when mode is not DAEMON', () => {
    process.env.NODE_ENV = 'test';

    const store = createFakeStore();
    const task = {cancel: jest.fn()};
    store.runSaga = jest.fn(() => task);

    const saga = function* saga() {
      yield undefined;
    };

    const Dummy = () => <div />;
    const Enhanced = injectSaga({
      key: 'messages',
      saga,
      mode: '@@saga-injector/restart-on-remount',
    })(Dummy);

    const tree = renderer.create(
      <ReactReduxContext.Provider value={{store}}>
        <Enhanced />
      </ReactReduxContext.Provider>,
    );

    tree.unmount();

    expect(task.cancel).toHaveBeenCalledTimes(1);
  });

  it('injects and ejects saga via useInjectSaga hook (non-DAEMON)', () => {
    process.env.NODE_ENV = 'test';

    const store = createFakeStore();
    const task = {cancel: jest.fn()};
    store.runSaga = jest.fn(() => task);

    const saga = function* saga() {
      yield undefined;
    };

    function HookComponent() {
      useInjectSaga({
        key: 'messages',
        saga,
        mode: '@@saga-injector/restart-on-remount',
      });
      return <div />;
    }

    let tree;
    act(() => {
      tree = renderer.create(
        <ReactReduxContext.Provider value={{store}}>
          <HookComponent />
        </ReactReduxContext.Provider>,
      );
    });

    expect(store.runSaga).toHaveBeenCalledTimes(1);
    expect(typeof store.injectedSagas.messages).toBe('object');

    act(() => {
      tree.unmount();
    });

    expect(task.cancel).toHaveBeenCalledTimes(1);
  });
});
