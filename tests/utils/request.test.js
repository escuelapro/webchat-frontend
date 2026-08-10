import request from 'utils/request';

describe('request', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns parsed JSON on successful response', async () => {
    const payload = {id: 1, name: 'test'};
    global.fetch.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(payload),
    });

    await expect(request('/api/items')).resolves.toEqual(payload);
    expect(global.fetch).toHaveBeenCalledWith('/api/items', undefined);
  });

  it('returns null for 204 No Content', async () => {
    global.fetch.mockResolvedValue({
      status: 204,
      statusText: 'No Content',
    });

    await expect(request('/api/items/1')).resolves.toBeNull();
  });

  it('returns null for 205 Reset Content', async () => {
    global.fetch.mockResolvedValue({
      status: 205,
      statusText: 'Reset Content',
    });

    await expect(request('/api/items/1')).resolves.toBeNull();
  });

  it('throws enriched error for non-2xx response with statusText', async () => {
    const response = {
      status: 500,
      statusText: 'Internal Server Error',
    };
    global.fetch.mockResolvedValue(response);

    await expect(request('/api/items')).rejects.toMatchObject({
      message: 'Internal Server Error',
      response,
    });
  });

  it('uses Forbidden fallback message for 403 without statusText', async () => {
    const response = {status: 403, statusText: ''};
    global.fetch.mockResolvedValue(response);

    await expect(request('/api/items')).rejects.toMatchObject({
      message: 'Forbidden',
      response,
    });
  });

  it('uses Unauthorized fallback message for 401 without statusText', async () => {
    const response = {status: 401, statusText: ''};
    global.fetch.mockResolvedValue(response);

    await expect(request('/api/items')).rejects.toMatchObject({
      message: 'Unauthorized',
      response,
    });
  });

  it('passes options through to fetch', async () => {
    const options = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({text: 'hello'}),
    };
    global.fetch.mockResolvedValue({
      status: 201,
      statusText: 'Created',
      json: () => Promise.resolve({ok: true}),
    });

    await request('/api/messages', options);

    expect(global.fetch).toHaveBeenCalledWith('/api/messages', options);
  });
});
