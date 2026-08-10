/* eslint-disable no-underscore-dangle */
import {runSaga} from 'redux-saga';

jest.mock('utils/storage', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('components/Chat/network', () => ({
  __esModule: true,
  logger: jest.fn(),
}));

function createWebSocketMock() {
  const instances = [];

  function MockWebSocket(url) {
    this.url = url;
    this.readyState = 0;
    this.OPEN = 1;
    this.send = jest.fn();
    this.addEventListener = jest.fn();
    this.onopen = null;
    this.onerror = null;
    this.onclose = null;
    instances.push(this);
  }

  MockWebSocket.CONNECTING = 0;
  MockWebSocket.OPEN = 1;
  MockWebSocket.instances = instances;

  return MockWebSocket;
}

function setupWindow(overrides = {}) {
  global.window = {
    location: {host: 'localhost.dev', pathname: '/chat'},
    instantChatBotUidName: 'user-1',
    __arsfChatIdg: 42,
    __arsfChatUrl: 'chat.example.com',
    __arsfChatIdu: 'operator-1',
    ...overrides,
  };
}

function loadSagaModule() {
  // Dynamic require is required after jest.resetModules() / NODE_ENV changes.
  // eslint-disable-next-line global-require
  return require('components/Chat/MessageList/saga');
}

async function runGenerator(generator, ...args) {
  const dispatched = [];
  await runSaga(
    {
      dispatch: action => dispatched.push(action),
      getState: () => ({}),
    },
    generator,
    ...args,
  ).toPromise();
  return dispatched;
}

describe('MessageList saga', () => {
  let Storage;
  let logger;
  let clear;
  let getData;
  let newMessage;
  let sendGroupAction;
  let rootSaga;
  let MockWebSocket;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // eslint-disable-next-line global-require
    Storage = require('utils/storage').default;
    // eslint-disable-next-line global-require
    ({logger} = require('components/Chat/network'));
    Storage.get.mockReturnValue(null);
    Storage.set.mockReset();
    logger.mockReset();

    MockWebSocket = createWebSocketMock();
    global.WebSocket = MockWebSocket;
    setupWindow();

    ({
      clear,
      getData,
      newMessage,
      sendGroupAction,
      default: rootSaga,
    } = loadSagaModule());
  });

  afterEach(() => {
    jest.useRealTimers();
    // eslint-disable-next-line no-console
    console.log.mockRestore();
    process.env.NODE_ENV = originalEnv;
    delete global.window;
    delete global.WebSocket;
  });

  describe('clear', () => {
    it('returns immediately when lastLocation is empty', () => {
      Storage.get.mockReturnValue('user-1');
      const gen = clear();

      expect(gen.next().done).toBe(true);
    });

    it('returns immediately when uid matches lastLocation', async () => {
      Storage.get.mockReturnValue('user-1');
      await runGenerator(getData, {});

      const gen = clear();
      expect(gen.next().done).toBe(true);
    });

    it('resets module state when uid changes', async () => {
      Storage.get.mockReturnValueOnce('user-a').mockReturnValue('user-b');
      await runGenerator(getData, {});

      const gen = clear();
      expect(gen.next().done).toBe(true);

      Storage.get.mockReturnValue('user-c');
      await runGenerator(getData, {});
      expect(MockWebSocket.instances).toHaveLength(2);
    });
  });

  describe('getData', () => {
    it('opens websocket on first call', async () => {
      await runGenerator(getData, {});

      expect(MockWebSocket.instances).toHaveLength(1);
      expect(MockWebSocket.instances[0].url).toBe('wss://chat.example.com/');
      expect(window.__arsfChat).toBe(MockWebSocket.instances[0]);
    });

    it('uses ws protocol in development', async () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();
      ({getData} = loadSagaModule());

      await runGenerator(getData, {});

      expect(MockWebSocket.instances[0].url).toBe('ws://chat.example.com/');
    });

    it('sends login message on socket open when not reconnecting', async () => {
      await runGenerator(getData, {});

      const socket = MockWebSocket.instances[0];
      socket.readyState = 1;
      socket.onopen();

      expect(socket.send).toHaveBeenCalledWith(
        JSON.stringify({
          message: 'hi',
          login: 1,
          host: 'localhost.dev',
          pathname: '/chat',
          g: 42,
          uid: 'user-1',
          u: 'operator-1',
        }),
      );
    });

    it('sends lastmes on mount when socket is already open', async () => {
      await runGenerator(getData, {});
      const socket = MockWebSocket.instances[0];
      socket.readyState = 1;
      socket.OPEN = 1;
      window.__arsfChat = socket;

      await runGenerator(getData, {mount: true});

      expect(socket.send).toHaveBeenCalledWith(
        JSON.stringify({service: 'lastmes', g: 42, uid: 'user-1'}),
      );
    });

    it('reconnects when socket exists but is closed', async () => {
      await runGenerator(getData, {});
      const closedSocket = MockWebSocket.instances[0];
      closedSocket.readyState = 3;
      closedSocket.OPEN = 1;
      window.__arsfChat = closedSocket;

      await runGenerator(getData, {});

      expect(MockWebSocket.instances).toHaveLength(2);
    });

    it('dispatches messages_clear when uid changes', async () => {
      Storage.get.mockReturnValueOnce('user-a').mockReturnValue('user-b');

      const firstPass = await runGenerator(getData, {});
      const secondPass = await runGenerator(getData, {});

      expect(firstPass).toEqual([]);
      expect(secondPass).toEqual([{type: 'messages_clear'}]);
    });

    it('prefers stored uid over window uid', async () => {
      Storage.get.mockReturnValue('stored-user');
      window.instantChatBotUidName = 'window-user';

      await runGenerator(getData, {mount: true});
      const socket = MockWebSocket.instances[0];
      socket.readyState = 1;
      socket.OPEN = 1;
      window.__arsfChat = socket;

      await runGenerator(getData, {mount: true});

      expect(socket.send).toHaveBeenCalledWith(
        JSON.stringify({service: 'lastmes', g: 42, uid: 'stored-user'}),
      );
    });

    it('dispatches messages_error when websocket construction fails', async () => {
      global.WebSocket = jest.fn(() => {
        throw new Error('websocket unavailable');
      });

      const dispatched = await runGenerator(getData, {});

      expect(logger).toHaveBeenCalledWith(expect.any(Error));
      expect(dispatched).toEqual([
        {type: 'messages_error', error: expect.any(Error)},
      ]);
    });

    it('sends lastmes on mount during initial socket open', async () => {
      await runGenerator(getData, {mount: true});
      const socket = MockWebSocket.instances[0];
      socket.readyState = 1;
      socket.onopen();

      expect(socket.send).toHaveBeenCalledWith(
        JSON.stringify({service: 'lastmes', g: 42, uid: 'user-1'}),
      );
    });

    it('defaults group id to 1 when missing', async () => {
      delete window.__arsfChatIdg;

      await runGenerator(getData, {});

      expect(window.__arsfChatIdg).toBe(1);
    });

    it('handles boundary params with isNewMessage flag', async () => {
      Storage.get.mockReturnValue('user-1');

      const dispatched = await runGenerator(getData, {isNewMessage: true});

      expect(dispatched).toEqual([]);
    });
  });

  describe('newMessage', () => {
    beforeEach(() => {
      window.__arsfChat = {send: jest.fn()};
    });

    it('sends message and dispatches messages_success for valid text', async () => {
      await runGenerator(getData, {});
      const dispatched = await runGenerator(newMessage, {text: 'hello'});

      expect(window.__arsfChat.send).toHaveBeenCalledWith(
        JSON.stringify({
          message: 'hello',
          host: 'localhost.dev',
          pathname: '/chat',
          g: 42,
          u: 'operator-1',
          uid: 'user-1',
          isRec: true,
        }),
      );
      expect(window.__arsfShowGreetings).toBe(false);
      expect(dispatched).toEqual([
        {
          type: 'messages_success',
          data: [
            expect.objectContaining({
              message: 'hello',
              uid: 'user-1',
            }),
          ],
        },
      ]);
    });

    it('returns early for empty text', async () => {
      const dispatched = await runGenerator(newMessage, {text: ''});

      expect(logger).toHaveBeenCalledWith('empty mess');
      expect(window.__arsfChat.send).not.toHaveBeenCalled();
      expect(dispatched).toEqual([]);
    });

    it('returns early for missing text', async () => {
      const dispatched = await runGenerator(newMessage, {});

      expect(logger).toHaveBeenCalledWith('empty mess');
      expect(dispatched).toEqual([]);
    });

    it('treats whitespace as valid text', async () => {
      const dispatched = await runGenerator(newMessage, {text: '   '});

      expect(window.__arsfChat.send).toHaveBeenCalled();
      expect(dispatched).toHaveLength(1);
    });

    it('logs error when websocket send fails', async () => {
      window.__arsfChat = {
        send: jest.fn(() => {
          throw new Error('send failed');
        }),
      };

      const dispatched = await runGenerator(newMessage, {text: 'hello'});

      expect(logger).toHaveBeenCalledWith(expect.any(Error));
      expect(dispatched).toEqual([]);
    });
  });

  describe('sendGroupAction', () => {
    it('handles setUid service and stores uid once', async () => {
      window.instantChatBotUidName = '';
      const payload = {
        service: 'setUid',
        message: 'generated-user',
        lastMess: [{id: 1, text: 'welcome'}],
      };

      const dispatched = await runGenerator(sendGroupAction, {
        message: JSON.stringify(payload),
      });

      expect(window.instantChatBotUidName).toBe('generated-user');
      expect(Storage.set).toHaveBeenCalledWith(
        'instantChatBotUidNameStored',
        'generated-user',
      );
      expect(dispatched).toEqual([
        {
          type: 'messages_success',
          data: [{id: 1, text: 'welcome'}],
        },
      ]);
    });

    it('does not overwrite existing instantChatBotUidName on setUid', async () => {
      window.instantChatBotUidName = 'existing-user';
      const payload = {
        service: 'setUid',
        message: 'new-user',
        lastMess: [],
      };

      await runGenerator(sendGroupAction, {
        message: JSON.stringify(payload),
      });

      expect(window.instantChatBotUidName).toBe('existing-user');
      expect(Storage.set).not.toHaveBeenCalled();
    });

    it('handles lastmes service with default empty history', async () => {
      const payload = {service: 'lastmes'};

      const dispatched = await runGenerator(sendGroupAction, {
        message: JSON.stringify(payload),
      });

      expect(dispatched).toEqual([{type: 'messages_success', data: []}]);
    });

    it('handles plain admin message for non-service payload', async () => {
      const dispatched = await runGenerator(sendGroupAction, {
        message: 'operator reply',
      });

      expect(dispatched).toEqual([
        {
          type: 'messages_success',
          data: [{message: 'operator reply', sender: 'admin'}],
        },
      ]);
    });

    it('skips greeting message when connected more than once', async () => {
      await runGenerator(getData, {});
      const socket = MockWebSocket.instances[0];
      socket.onclose();
      jest.advanceTimersByTime(1000);

      const dispatched = await runGenerator(sendGroupAction, {
        message: JSON.stringify({greeting: true, message: 'hello'}),
      });

      expect(dispatched).toEqual([]);
    });

    it('logs and keeps string payload when JSON parsing fails', async () => {
      const dispatched = await runGenerator(sendGroupAction, {
        message: '{invalid-json',
      });

      expect(logger).toHaveBeenCalledWith(expect.any(SyntaxError));
      expect(dispatched).toEqual([
        {
          type: 'messages_success',
          data: [{message: '{invalid-json', sender: 'admin'}],
        },
      ]);
    });

    it('uses parsed object when message contains valid JSON', async () => {
      const payload = {
        message: 'parsed',
        meta: {source: 'ws'},
      };

      const dispatched = await runGenerator(sendGroupAction, {
        message: JSON.stringify(payload),
      });

      expect(dispatched).toEqual([
        {
          type: 'messages_success',
          data: [{...payload, sender: 'admin'}],
        },
      ]);
    });

    it('logs error for invalid params', async () => {
      const dispatched = await runGenerator(sendGroupAction, null);

      expect(logger).toHaveBeenCalledWith(expect.any(TypeError));
      expect(dispatched).toEqual([]);
    });
  });

  describe('connect side effects', () => {
    it('registers message listener and forwards to emitter', async () => {
      const emitter = jest.fn();
      window.__arsfChatEmmitter = emitter;

      await runGenerator(getData, {});
      const socket = MockWebSocket.instances[0];
      const handler = socket.addEventListener.mock.calls.find(
        call => call[0] === 'message',
      )[1];
      const event = {data: '{"message":"ping"}'};

      handler(event);

      expect(emitter).toHaveBeenCalledWith('__arsfChatEmmittermess', event);
    });

    it('reconnects after close when reconnect flag is enabled', async () => {
      await runGenerator(getData, {});
      const socket = MockWebSocket.instances[0];

      socket.onclose();
      jest.advanceTimersByTime(1000);

      expect(MockWebSocket.instances).toHaveLength(2);
    });

    it('does not reconnect after error closes the socket', async () => {
      await runGenerator(getData, {});
      const socket = MockWebSocket.instances[0];

      socket.onerror({});
      socket.onclose();
      jest.advanceTimersByTime(1000);

      expect(MockWebSocket.instances).toHaveLength(1);
    });
  });

  describe('default saga', () => {
    it('wires takeLatest handlers for all actions', () => {
      const gen = rootSaga();
      const expectedActions = [
        'messages_clear',
        'messages_load',
        'send_action',
        'scroll_mess',
        'messages_test',
      ];

      expectedActions.forEach(actionType => {
        const effect = gen.next().value;
        expect(effect.type).toBe('FORK');
        expect(effect.payload.fn.name).toMatch(/takeLatest/);
        expect(effect.payload.args[0]).toBe(actionType);
        expect(typeof effect.payload.args[1]).toBe('function');
      });

      expect(gen.next().done).toBe(true);
    });
  });
});
