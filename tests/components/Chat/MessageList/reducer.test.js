import reducer, {initialState} from 'components/Chat/MessageList/reducer';

describe('MessageList reducer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML =
      '<div class="arsf-messenger-scrollable content"></div>';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  it('returns initial state for unknown action', () => {
    expect(reducer(undefined, {type: 'UNKNOWN'})).toEqual(initialState);
  });

  it('clears messages on messages_clear', () => {
    const state = {
      ...initialState,
      loading: true,
      error: true,
      action: {id: 1},
      messages: {messages: [{id: 1}], total: 1},
    };

    expect(reducer(state, {type: 'messages_clear'})).toEqual(initialState);
  });

  it('sets loading on messages_load', () => {
    const next = reducer(initialState, {type: 'messages_load'});

    expect(next.loading).toBe(true);
    expect(next.error).toBe(false);
    expect(next.action).toBe(false);
  });

  it('sets loading on messages_test', () => {
    const next = reducer(initialState, {type: 'messages_test'});

    expect(next.loading).toBe(true);
    expect(next.error).toBe(false);
  });

  it('sets loading on message_load without resetting action', () => {
    const state = {...initialState, action: {id: 99}};
    const next = reducer(state, {type: 'message_load'});

    expect(next.loading).toBe(true);
    expect(next.error).toBe(false);
    expect(next.action).toEqual({id: 99});
  });

  it('replaces messages on messages_success when isNew is true', () => {
    const existing = [{id: 1, text: 'old'}];
    const incoming = [{id: 2, text: 'new'}, {id: 3, text: 'latest'}];
    const state = {
      ...initialState,
      messages: {messages: existing, total: 1},
    };

    const next = reducer(state, {
      type: 'messages_success',
      data: incoming,
      total: 2,
      isNew: true,
    });

    expect(next.loading).toBe(false);
    expect(next.messages).toEqual({
      messages: [{id: 3, text: 'latest'}, {id: 2, text: 'new'}],
      total: 2,
    });
  });

  it('concatenates messages on messages_success by default', () => {
    const existing = [{id: 1, text: 'old'}];
    const incoming = [{id: 2, text: 'new'}];
    const state = {
      ...initialState,
      messages: {messages: existing, total: 1},
    };

    const next = reducer(state, {
      type: 'messages_success',
      data: incoming,
      total: 2,
    });

    expect(next.messages).toEqual({
      messages: [{id: 1, text: 'old'}, {id: 2, text: 'new'}],
      total: 2,
    });
  });

  it('replaces messages on messages_success when isNewMessage is true', () => {
    const existing = [{id: 1, text: 'old'}];
    const incoming = [{id: 2, text: 'new'}];
    const state = {
      ...initialState,
      messages: {messages: existing, total: 1},
    };
    const scrollable = document.querySelector(
      '.arsf-messenger-scrollable.content',
    );
    Object.defineProperty(scrollable, 'scrollHeight', {
      value: 500,
      configurable: true,
    });
    scrollable.scrollTop = 0;

    const next = reducer(state, {
      type: 'messages_success',
      data: incoming,
      total: 1,
      isNewMessage: true,
    });

    expect(next.messages).toEqual({
      messages: [{id: 2, text: 'new'}],
      total: 1,
    });

    jest.advanceTimersByTime(100);
    expect(scrollable.scrollTop).toBe(500);
  });

  it('appends single message on message_success', () => {
    const state = {
      ...initialState,
      messages: {messages: [{id: 1}], total: 1},
    };

    const next = reducer(state, {
      type: 'message_success',
      data: {id: 2, text: 'reply'},
    });

    expect(next.loading).toBe(false);
    expect(next.messages).toEqual({
      messages: [{id: 1}, {id: 2, text: 'reply'}],
    });
  });

  it('wraps array payload on message_success', () => {
    const state = {
      ...initialState,
      messages: {messages: [], total: 0},
    };

    const next = reducer(state, {
      type: 'message_success',
      data: [{id: 1}, {id: 2}],
    });

    expect(next.messages.messages).toEqual([{id: 1}, {id: 2}]);
  });

  it('stores error on messages_error', () => {
    const error = new Error('Network error');
    const next = reducer(initialState, {type: 'messages_error', error});

    expect(next.error).toBe(error);
    expect(next.loading).toBe(false);
  });

  it('stores action payload on action_success', () => {
    const actionData = {type: 'join', groupId: 42};
    const next = reducer(initialState, {
      type: 'action_success',
      data: actionData,
    });

    expect(next.action).toEqual(actionData);
    expect(next.loading).toBe(false);
  });
});
