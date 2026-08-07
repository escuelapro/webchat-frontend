import Storage from 'utils/storage';

describe('Storage', () => {
  let store;

  beforeEach(() => {
    store = {};
    global.localStorage = {
      getItem: jest.fn(key =>
        Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null,
      ),
      setItem: jest.fn((key, value) => {
        store[key] = value;
      }),
      removeItem: jest.fn(key => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('get / set', () => {
    it('returns default value when key is missing', () => {
      expect(Storage.get('missing', 'fallback')).toBe('fallback');
    });

    it('returns stored string value', () => {
      Storage.set('token', 'abc123');
      expect(Storage.get('token')).toBe('abc123');
    });

    it('parses JSON values that start with {', () => {
      Storage.set('profile', '{"name":"Alice","age":30}');
      expect(Storage.get('profile')).toEqual({name: 'Alice', age: 30});
    });

    it('does not parse non-JSON strings', () => {
      Storage.set('note', 'hello world');
      expect(Storage.get('note')).toBe('hello world');
    });
  });

  describe('getInt / inc', () => {
    it('returns 0 for missing numeric key', () => {
      expect(Storage.getInt('counter')).toBe(0);
    });

    it('returns parsed integer value', () => {
      Storage.set('counter', '5');
      expect(Storage.getInt('counter')).toBe(5);
    });

    it('returns 0 for non-numeric stored value', () => {
      Storage.set('counter', 'not-a-number');
      expect(Storage.getInt('counter')).toBe(0);
    });

    it('increments stored counter and persists result', () => {
      Storage.set('counter', '2');
      Storage.inc('counter', 3);
      expect(Storage.getInt('counter')).toBe(5);
    });

    it('treats invalid increment as zero', () => {
      Storage.set('counter', '1');
      Storage.inc('counter', 'invalid');
      expect(Storage.getInt('counter')).toBe(1);
    });
  });

  describe('rm / clear', () => {
    it('removes a key', () => {
      Storage.set('temp', 'value');
      Storage.rm('temp');
      expect(Storage.get('temp', null)).toBeNull();
    });

    it('clears all keys', () => {
      Storage.set('a', '1');
      Storage.set('b', '2');
      Storage.clear();
      expect(Storage.get('a', null)).toBeNull();
      expect(Storage.get('b', null)).toBeNull();
    });
  });

  describe('sessionClear', () => {
    let sessionStorageMock;

    beforeEach(() => {
      let sessionStore = {};
      sessionStorageMock = {
        getItem: jest.fn(key =>
          Object.prototype.hasOwnProperty.call(sessionStore, key)
            ? sessionStore[key]
            : null,
        ),
        setItem: jest.fn((key, value) => {
          sessionStore[key] = value;
        }),
        clear: jest.fn(() => {
          sessionStore = {};
        }),
      };
      Object.defineProperty(global, 'sessionStorage', {
        value: sessionStorageMock,
        writable: true,
        configurable: true,
      });
      document.body.innerHTML =
        '<div id="unreadNotify" class="blink_me">5</div>';
    });

    it('preserves session keys and clears unread notification', () => {
      sessionStorageMock.setItem('isDup', '1');
      sessionStorageMock.setItem('tabID', 'tab-1');
      sessionStorageMock.setItem('temp', 'remove-me');

      Storage.sessionClear();

      expect(sessionStorageMock.clear).toHaveBeenCalled();
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('isDup', '1');
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('tabID', 'tab-1');

      const notify = document.getElementById('unreadNotify');
      expect(notify.classList.contains('blink_me')).toBe(false);
      expect(notify.innerText).toBe('');
    });
  });

  describe('resetFilter', () => {
    beforeEach(() => {
      delete global.window;
      global.window = {location: {pathname: '/chat'}};
    });

    it('removes autocomplete keys for current pathname', () => {
      Storage.set('autocomplete_/chat_user', '1');
      Storage.set('autocomplete_/chat_group', '2');
      Storage.set('autocomplete_/other_user', '3');
      Storage.set('unrelated', 'keep');

      Storage.resetFilter();

      expect(Storage.get('autocomplete_/chat_user', null)).toBeNull();
      expect(Storage.get('autocomplete_/chat_group', null)).toBeNull();
      expect(Storage.get('autocomplete_/other_user')).toBe('3');
      expect(Storage.get('unrelated')).toBe('keep');
    });

    it('uses custom filter name when provided', () => {
      Storage.set('autocomplete_/inbox_user', '1');
      Storage.set('autocomplete_/chat_user', '2');

      Storage.resetFilter('/inbox');

      expect(Storage.get('autocomplete_/inbox_user', null)).toBeNull();
      expect(Storage.get('autocomplete_/chat_user')).toBe('2');
    });
  });
});
