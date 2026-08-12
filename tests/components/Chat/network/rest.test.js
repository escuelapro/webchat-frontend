import {docApiUrl} from 'components/Chat/network/rest';

jest.mock('utils/storage', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    rm: jest.fn(),
    clear: jest.fn(),
    sessionClear: jest.fn(),
    resetFilter: jest.fn(),
  },
}));

jest.mock('utils/request', () => ({
  __esModule: true,
  default: jest.fn(),
}));

let Storage;
let request;

async function runIterator(iterator, nextArg, isThrow = false) {
  const step = isThrow ? iterator.throw(nextArg) : iterator.next(nextArg);
  if (step.done) {
    return step.value;
  }

  const yielded = step.value;

  // Nested generator: e.g. yield getHeader(...)
  if (yielded && typeof yielded.next === 'function') {
    const nestedValue = await runIterator(yielded);
    return runIterator(iterator, nestedValue);
  }

  // Promise: e.g. yield request(...)
  if (yielded && typeof yielded.then === 'function') {
    try {
      const resolved = await yielded;
      return runIterator(iterator, resolved);
    } catch (err) {
      // Let the generator's own try/catch handle the failure.
      return runIterator(iterator, err, true);
    }
  }

  // Unknown yield: pass it back.
  return runIterator(iterator, yielded);
}

function loadRestModule() {
  // Dynamic require is required after jest.resetModules().
  // eslint-disable-next-line global-require
  return require('components/Chat/network/rest');
}

describe('docApiUrl', () => {
  it('appends ? when url has no query string', () => {
    expect(docApiUrl('/v1/objects')).toBe('/v1/objects?');
  });

  it('appends & when url already contains query string', () => {
    expect(docApiUrl('/v1/objects?model=groups')).toBe(
      '/v1/objects?model=groups&',
    );
  });

  it('handles urls with multiple existing params', () => {
    expect(docApiUrl('/getMessages?user_id=1&limit=10')).toBe(
      '/getMessages?user_id=1&limit=10&',
    );
  });

  it('handles empty path segment before query', () => {
    expect(docApiUrl('?service=avitochat')).toBe('?service=avitochat&');
  });
});

describe('Chat network rest generators', () => {
  const originalEnv = process.env.REST_API;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    process.env.REST_API = 'https://api.example.test/v1';
    // eslint-disable-next-line global-require
    Storage = require('utils/storage').default;
    // eslint-disable-next-line global-require
    request = require('utils/request').default;

    Storage.get.mockReturnValue('token-1');
    request.mockImplementation(() => Promise.resolve({ok: true}));
  });

  afterEach(() => {
    process.env.REST_API = originalEnv;
  });

  it('getMessages: uses REST_API value (API_URL2 branch) and passes headers', async () => {
    const {getMessages} = loadRestModule();

    const params = ['limit=10'];
    const gen = getMessages('user-1', params);
    const res = await runIterator(gen);

    expect(res).toEqual({ok: true});

    expect(request).toHaveBeenCalledTimes(1);
    const [url, options] = request.mock.calls[0];
    expect(url).toContain('/getMessages?user_id=user-1&limit=10');
    expect(url).toContain('https://api.example.test/v1');
    expect(options.headers.Authorization).toBe('Bearer token-1');
  });

  it('sendMessage: sets POST options and JSON body', async () => {
    const {sendMessage} = loadRestModule();

    const payload = {message: 'hello'};
    const gen = sendMessage('user-1', 'chat-1', payload);
    await runIterator(gen);

    expect(request).toHaveBeenCalledTimes(1);
    const [url, options] = request.mock.calls[0];

    expect(url).toBe('?user_id=user-1&');
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify(payload));
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers.Accept).toBe('application/json');
    expect(options.headers.Referer).toBe('http://localhost.dev');
    expect(options.headers.Authorization).toBe('Bearer token-1');
  });

  it('getGroups: builds v1/objects URL and uses Authorization only (no post headers)', async () => {
    const {getGroups} = loadRestModule();

    const params = ['model=groups'];
    const gen = getGroups('user-1', params);
    await runIterator(gen);

    expect(request).toHaveBeenCalledTimes(1);
    const [url, options] = request.mock.calls[0];

    expect(url).toContain('v1/objects?');
    expect(url).toContain('user_id=user-1');
    expect(options.headers.Authorization).toBe('Bearer token-1');
    expect(options.headers['Content-Type']).toBeUndefined();
  });

  it('addGroups: uses POST and includes JSON body', async () => {
    const {addGroups} = loadRestModule();

    const payload = [{id: 1}];
    const gen = addGroups(payload);
    await runIterator(gen);

    expect(request).toHaveBeenCalledTimes(1);
    const [url, options] = request.mock.calls[0];

    expect(url).toContain('v1/objects?');
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify(payload));
  });

  it('req: swallows request errors and logs them', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    request.mockImplementation(() => Promise.reject(new Error('boom')));

    const {getGroups} = loadRestModule();
    const gen = getGroups('user-1', []);
    const res = await runIterator(gen);

    expect(res).toBeUndefined();
    expect(logSpy).toHaveBeenCalled();
  });
});
