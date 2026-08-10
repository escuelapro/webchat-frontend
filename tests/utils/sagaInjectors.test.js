import getInjectors, {
  injectSagaFactory,
  ejectSagaFactory,
} from 'utils/sagaInjectors';
import {DAEMON, ONCE_TILL_UNMOUNT, RESTART_ON_REMOUNT} from 'utils/constants';

function createStore(overrides = {}) {
  const task = {cancel: jest.fn()};
  return {
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    getState: jest.fn(),
    replaceReducer: jest.fn(),
    runSaga: jest.fn(() => task),
    injectedReducers: {},
    injectedSagas: {},
    ...overrides,
  };
}

describe('sagaInjectors', () => {
  const originalEnv = process.env.NODE_ENV;
  let store;
  let saga;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    store = createStore();
    saga = function* testSaga() {
      yield undefined;
    };
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.resetAllMocks();
  });

  describe('injectSagaFactory', () => {
    it('injects saga with DAEMON mode by default', () => {
      const injectSaga = injectSagaFactory(store, true);

      injectSaga('chatSaga', {saga});

      expect(store.runSaga).toHaveBeenCalledWith(saga, undefined);
      expect(store.injectedSagas.chatSaga.mode).toBe(DAEMON);
      expect(store.injectedSagas.chatSaga.task).toBeDefined();
    });

    it('does not re-run DAEMON saga on second inject', () => {
      const injectSaga = injectSagaFactory(store, true);

      injectSaga('chatSaga', {saga, mode: DAEMON});
      injectSaga('chatSaga', {saga, mode: DAEMON});

      expect(store.runSaga).toHaveBeenCalledTimes(1);
    });

    it('re-runs saga for RESTART_ON_REMOUNT mode', () => {
      const injectSaga = injectSagaFactory(store, true);

      injectSaga('chatSaga', {saga, mode: RESTART_ON_REMOUNT});
      injectSaga('chatSaga', {saga, mode: RESTART_ON_REMOUNT});

      expect(store.runSaga).toHaveBeenCalledTimes(2);
    });

    it('does not re-run ONCE_TILL_UNMOUNT saga on second inject', () => {
      const injectSaga = injectSagaFactory(store, true);

      injectSaga('chatSaga', {saga, mode: ONCE_TILL_UNMOUNT});
      injectSaga('chatSaga', {saga, mode: ONCE_TILL_UNMOUNT});

      expect(store.runSaga).toHaveBeenCalledTimes(1);
    });

    it('passes args to runSaga', () => {
      const injectSaga = injectSagaFactory(store, true);
      const args = {userId: 42};

      injectSaga('chatSaga', {saga}, args);

      expect(store.runSaga).toHaveBeenCalledWith(saga, args);
    });

    it('cancels previous saga in development when saga reference changes', () => {
      process.env.NODE_ENV = 'development';
      const injectSaga = injectSagaFactory(store, true);
      const oldTask = {cancel: jest.fn()};
      store.injectedSagas.chatSaga = {
        saga: function* oldSaga() {
          yield undefined;
        },
        mode: DAEMON,
        task: oldTask,
      };

      injectSaga('chatSaga', {saga, mode: DAEMON});

      expect(oldTask.cancel).toHaveBeenCalledTimes(1);
      expect(store.runSaga).toHaveBeenCalledTimes(1);
    });

    it('validates store when isValid is false', () => {
      const invalidStore = createStore({runSaga: undefined});
      const injectSaga = injectSagaFactory(invalidStore, false);

      expect(() => injectSaga('chatSaga', {saga})).toThrow(
        '(app/utils...) injectors: Expected a valid redux store',
      );
    });

    it('throws when key is empty', () => {
      const injectSaga = injectSagaFactory(store, true);

      expect(() => injectSaga('', {saga})).toThrow(
        '(app/utils...) injectSaga: Expected `key` to be a non empty string',
      );
    });

    it('throws when descriptor is invalid', () => {
      const injectSaga = injectSagaFactory(store, true);

      expect(() => injectSaga('chatSaga', {saga: 'not-a-function'})).toThrow(
        '(app/utils...) injectSaga: Expected a valid saga descriptor',
      );

      expect(() =>
        injectSaga('chatSaga', {saga, mode: 'invalid-mode'}),
      ).toThrow('(app/utils...) injectSaga: Expected a valid saga descriptor');
    });
  });

  describe('ejectSagaFactory', () => {
    it('cancels non-DAEMON saga and marks it done in production', () => {
      process.env.NODE_ENV = 'production';
      const task = {cancel: jest.fn()};
      store.injectedSagas.chatSaga = {
        saga,
        mode: RESTART_ON_REMOUNT,
        task,
      };
      const ejectSaga = ejectSagaFactory(store, true);

      ejectSaga('chatSaga');

      expect(task.cancel).toHaveBeenCalledTimes(1);
      expect(store.injectedSagas.chatSaga).toBe('done');
    });

    it('cancels non-DAEMON saga but keeps descriptor in non-production', () => {
      process.env.NODE_ENV = 'development';
      const descriptor = {
        saga,
        mode: ONCE_TILL_UNMOUNT,
        task: {cancel: jest.fn()},
      };
      store.injectedSagas.chatSaga = descriptor;
      const ejectSaga = ejectSagaFactory(store, true);

      ejectSaga('chatSaga');

      expect(descriptor.task.cancel).toHaveBeenCalledTimes(1);
      expect(store.injectedSagas.chatSaga).toBe(descriptor);
    });

    it('does not cancel DAEMON saga on eject', () => {
      const task = {cancel: jest.fn()};
      store.injectedSagas.chatSaga = {
        saga,
        mode: DAEMON,
        task,
      };
      const ejectSaga = ejectSagaFactory(store, true);

      ejectSaga('chatSaga');

      expect(task.cancel).not.toHaveBeenCalled();
    });

    it('is noop when saga key is missing', () => {
      const ejectSaga = ejectSagaFactory(store, true);

      expect(() => ejectSaga('missing')).not.toThrow();
    });

    it('validates store when isValid is false', () => {
      const invalidStore = createStore({runSaga: undefined});
      const ejectSaga = ejectSagaFactory(invalidStore, false);

      expect(() => ejectSaga('chatSaga')).toThrow(
        '(app/utils...) injectors: Expected a valid redux store',
      );
    });
  });

  describe('getInjectors', () => {
    it('returns injectSaga and ejectSaga bound to store', () => {
      const {injectSaga, ejectSaga} = getInjectors(store);

      injectSaga('chatSaga', {saga, mode: RESTART_ON_REMOUNT});
      ejectSaga('chatSaga');

      expect(store.runSaga).toHaveBeenCalledTimes(1);
      expect(store.injectedSagas.chatSaga.task.cancel).toHaveBeenCalledTimes(1);
    });

    it('throws when store is invalid', () => {
      expect(() => getInjectors(createStore({dispatch: undefined}))).toThrow(
        '(app/utils...) injectors: Expected a valid redux store',
      );
    });
  });
});
