/* eslint-disable global-require, no-underscore-dangle, no-param-reassign */

jest.mock('react', () => {
  const ActualReact = jest.requireActual('react');
  return {
    ...ActualReact,
    memo: component => component,
  };
});

jest.mock('utils/storage', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    rm: jest.fn(),
  },
}));

jest.mock('components/Chat/MessageList', () => {
  const ReactMock = require('react');
  return () => ReactMock.createElement('div', {'data-testid': 'message-list'});
});

jest.mock('components/Chat/styled', () => {
  const ReactMock = require('react');
  return {
    __esModule: true,
    default: () => ({children, ...rest}) =>
      ReactMock.createElement(
        'div',
        {'data-testid': 'styled-Messenger', ...rest},
        children,
      ),
  };
});

function setHref(href) {
  // jsdom location is tricky; replace the whole object when possible.
  try {
    delete window.location;
  } catch (e) {
    // ignore
  }
  window.location = {
    href,
    host: 'localhost',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  };
}

function resetSession(initial = {}) {
  const raw = {};
  Object.keys(initial).forEach(key => {
    raw[key] = initial[key];
  });

  const storage = {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(raw, key) ? raw[key] : null;
    },
    setItem(key, value) {
      raw[key] = String(value);
    },
    removeItem(key) {
      delete raw[key];
    },
    clear() {
      Object.keys(raw).forEach(key => delete raw[key]);
    },
    key() {
      return null;
    },
    get length() {
      return Object.keys(raw).length;
    },
  };

  // Support property-style access used by Messenger.
  return new Proxy(storage, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') {
        return Object.prototype.hasOwnProperty.call(raw, prop)
          ? raw[prop]
          : undefined;
      }
      return undefined;
    },
    set(target, prop, value) {
      if (typeof prop === 'string') {
        raw[prop] = value;
        return true;
      }
      return false;
    },
    deleteProperty(target, prop) {
      if (typeof prop === 'string') {
        delete raw[prop];
        return true;
      }
      return false;
    },
    has(target, prop) {
      return prop in target || Object.prototype.hasOwnProperty.call(raw, prop);
    },
    ownKeys() {
      return Object.keys(raw);
    },
    getOwnPropertyDescriptor(target, prop) {
      if (Object.prototype.hasOwnProperty.call(raw, prop)) {
        return {
          configurable: true,
          enumerable: true,
          writable: true,
          value: raw[prop],
        };
      }
      return Object.getOwnPropertyDescriptor(target, prop);
    },
  });
}

function loadMessenger({
  href = 'https://example.test/chat',
  sessionInitial = {},
  storageGet = null,
} = {}) {
  jest.resetModules();
  setHref(href);

  const session = resetSession(sessionInitial);
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    writable: true,
    value: session,
  });

  const Storage = require('utils/storage').default;
  Storage.get.mockReset();
  Storage.set.mockReset();
  Storage.rm.mockReset();
  Storage.get.mockImplementation(() => storageGet);

  const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
  const Messenger = require('components/Chat/Messenger').default;

  // After resetModules, React/RTL must come from the same module graph.
  const ReactAfterReset = require('react');
  const {render, cleanup, act} = require('react-testing-library');

  return {
    Messenger,
    Storage,
    session,
    rawSession: session,
    addEventListenerSpy,
    React: ReactAfterReset,
    render,
    cleanup,
    act,
  };
}

function readSession(session, key) {
  return session[key];
}

describe('Chat Messenger', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('module load side effects', () => {
    it('uses default tab keys and initializes first visit', () => {
      const {Storage, session, addEventListenerSpy} = loadMessenger({
        href: 'https://example.test/chat',
        storageGet: null,
        sessionInitial: {},
      });

      expect(Storage.get).toHaveBeenCalledWith('tabID');
      expect(Storage.set).toHaveBeenCalledWith('tabID', 1);
      expect(readSession(session, 'tabID')).toBe(1);
      expect(readSession(session, 'isDup')).toBe(1);
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function),
      );
    });

    it('uses dev tab keys when URL contains 3011', () => {
      const {Storage, session} = loadMessenger({
        href: 'https://example.test:3011/chat',
        storageGet: null,
        sessionInitial: {},
      });

      expect(Storage.get).toHaveBeenCalledWith('tabIdDev');
      expect(Storage.set).toHaveBeenCalledWith('tabIdDev', 1);
      expect(readSession(session, 'tabIdDev')).toBe(1);
      expect(readSession(session, 'isDupDev')).toBe(1);
    });

    it('parses client id from URL into tab id', () => {
      const {Storage, session} = loadMessenger({
        href: 'https://example.test/client/42/profile',
        storageGet: null,
        sessionInitial: {},
      });

      expect(Storage.set).toHaveBeenCalledWith('tabID', '42');
      expect(readSession(session, 'tabID')).toBe('42');
      expect(readSession(session, 'isDup')).toBe('42');
    });

    it('reuses existing session tab id when already present', () => {
      const {Storage, session} = loadMessenger({
        href: 'https://example.test/chat',
        storageGet: null,
        sessionInitial: {tabID: 'existing-tab'},
      });

      expect(Storage.set).toHaveBeenCalledWith('tabID', 'existing-tab');
      expect(readSession(session, 'tabID')).toBe('existing-tab');
    });

    it('deletes tab keys on non-first visit with existing isDup', () => {
      const {session, Storage} = loadMessenger({
        href: 'https://example.test/client/7/x',
        storageGet: 'already-set',
        sessionInitial: {
          tabID: 'old-tab',
          isDup: '1',
        },
      });

      expect(readSession(session, 'tabID')).toBeUndefined();
      expect(Storage.set).not.toHaveBeenCalled();
    });

    it('sets isDup to already loaded when empty string', () => {
      const {session} = loadMessenger({
        href: 'https://example.test/chat',
        storageGet: 'stored',
        sessionInitial: {
          tabID: 't1',
          isDup: '',
        },
      });

      expect(readSession(session, 'isDup')).toBe('already loaded');
      expect(readSession(session, 'tabID')).toBeUndefined();
    });

    it('beforeunload removes matching Storage tab key and clears isDup', () => {
      const {Storage, session, addEventListenerSpy} = loadMessenger({
        href: 'https://example.test/chat',
        storageGet: null,
        sessionInitial: {},
      });

      const beforeUnload = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'beforeunload',
      )[1];

      session.tabID = '1';
      Storage.get.mockReturnValue('1');
      Storage.rm.mockClear();

      beforeUnload();

      expect(Storage.rm).toHaveBeenCalledWith('tabID');
      expect(readSession(session, 'isDup')).toBe('');
    });

    it('beforeunload does not remove Storage key when values differ', () => {
      const {Storage, session, addEventListenerSpy} = loadMessenger({
        href: 'https://example.test/chat',
        storageGet: null,
        sessionInitial: {},
      });

      const beforeUnload = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'beforeunload',
      )[1];

      session.tabID = 'session-value';
      Storage.get.mockReturnValue('other-value');
      Storage.rm.mockClear();

      beforeUnload();

      expect(Storage.rm).not.toHaveBeenCalled();
      expect(readSession(session, 'isDup')).toBe('');
    });
  });

  describe('component render', () => {
    it('renders MessageList and stores userId from URL on mount', () => {
      const {
        Messenger,
        Storage,
        render,
        cleanup,
        act,
        React: R,
      } = loadMessenger({
        href: 'https://example.test/client/99/room',
        storageGet: null,
        sessionInitial: {},
      });

      Storage.set.mockClear();

      let utils;
      act(() => {
        utils = render(R.createElement(Messenger, {userIds: {group: 1}}));
      });

      expect(utils.getByTestId('message-list')).toBeTruthy();
      expect(utils.container.querySelector('.arsf-messenger')).toBeTruthy();
      expect(Storage.set).toHaveBeenCalledWith('tabID', '99');

      cleanup();
    });

    it('stores undefined userId when URL has no client segment', () => {
      const {
        Messenger,
        Storage,
        render,
        cleanup,
        act,
        React: R,
      } = loadMessenger({
        href: 'https://example.test/chat',
        storageGet: null,
        sessionInitial: {},
      });

      Storage.set.mockClear();

      act(() => {
        render(R.createElement(Messenger, {userIds: 'u1'}));
      });

      expect(Storage.set).toHaveBeenCalledWith('tabID', undefined);
      cleanup();
    });
  });
});
