/* eslint-disable no-underscore-dangle */
import React from 'react';
import renderer from 'react-test-renderer';
import {render, cleanup} from 'react-testing-library';

import observe, {emitData} from 'utils/observers';
import MessageList from 'components/Chat/MessageList';

jest.mock('react', () => {
  const ActualReact = jest.requireActual('react');
  return {
    ...ActualReact,
    memo: component => component,
  };
});

let mapStateToProps;
let mapDispatchToProps;

jest.mock('utils/injectSaga', () => () => Component => Component);
jest.mock('utils/injectReducer', () => () => Component => Component);
jest.mock('react-redux', () => ({
  connect: (stateMapper, dispatchMapper) => {
    mapStateToProps = stateMapper;
    mapDispatchToProps = dispatchMapper;
    return Component => Component;
  },
}));

jest.mock('components/Chat/styled', () => {
  // eslint-disable-next-line global-require
  const ReactMock = require('react');
  return {
    __esModule: true,
    default: name => ({children, ...rest}) =>
      ReactMock.createElement(
        'div',
        {'data-testid': `styled-${name}`, ...rest},
        children,
      ),
  };
});

jest.mock('components/Chat/Compose', () => {
  // eslint-disable-next-line global-require
  const ReactMock = require('react');
  return () => ReactMock.createElement('div', {'data-testid': 'compose'});
});

jest.mock('components/Chat/Message', () => {
  // eslint-disable-next-line global-require
  const ReactMock = require('react');
  return props => {
    if (!props.data.message) {
      return null;
    }
    return ReactMock.createElement(
      'div',
      {
        'data-testid': 'message',
        'data-starts': String(props.startsSequence),
        'data-ends': String(props.endsSequence),
        'data-timestamp': String(props.showTimestamp),
        'data-show-more': String(props.showMore),
      },
      props.data.message,
    );
  };
});

jest.mock('components/Chat/Loader', () => {
  // eslint-disable-next-line global-require
  const ReactMock = require('react');
  return () => ReactMock.createElement('div', {'data-testid': 'loader'});
});

jest.mock('utils/observers', () => ({
  __esModule: true,
  default: jest.fn(),
  emitData: jest.fn(),
}));

function createMessage(overrides = {}) {
  return {
    message: 'hello',
    sender: 'user',
    createdAt: '2026-08-07T10:00:00.000Z',
    ...overrides,
  };
}

function createProps(overrides = {}) {
  return {
    messages: {messages: [], total: 0},
    loading: false,
    error: false,
    action: false,
    clear: jest.fn(),
    getMessages: jest.fn(),
    sendAction: jest.fn(),
    ...overrides,
  };
}

function setupScrollContainer() {
  const element = {
    scrollTop: 0,
    scrollHeight: 500,
  };
  document.querySelector = jest.fn(selector => {
    if (
      selector === '.arsf-messenger-scrollable .arsf-message-list-container'
    ) {
      return element;
    }
    return null;
  });
  return element;
}

describe('MessageList index', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.__arsfShowGreetings = true;
    window.location = {search: '?tab=1'};
    observe.mockReset();
    setupScrollContainer();
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('mapDispatchToProps', () => {
    it('dispatches messages_clear', () => {
      const dispatch = jest.fn();
      const {clear} = mapDispatchToProps(dispatch);

      clear({reset: true});

      expect(dispatch).toHaveBeenCalledWith({
        type: 'messages_clear',
        reset: true,
      });
    });

    it('dispatches messages_load', () => {
      const dispatch = jest.fn();
      const {getMessages} = mapDispatchToProps(dispatch);

      getMessages({mount: 1});

      expect(dispatch).toHaveBeenCalledWith({
        type: 'messages_load',
        mount: 1,
      });
    });

    it('dispatches send_action', () => {
      const dispatch = jest.fn();
      const {sendAction} = mapDispatchToProps(dispatch);

      sendAction({message: 'ping'});

      expect(dispatch).toHaveBeenCalledWith({
        type: 'send_action',
        message: 'ping',
      });
    });

    it('handles empty dispatch params', () => {
      const dispatch = jest.fn();
      const actions = mapDispatchToProps(dispatch);

      actions.clear();
      actions.getMessages();
      actions.sendAction();

      expect(dispatch).toHaveBeenCalledTimes(3);
    });
  });

  describe('mapStateToProps', () => {
    it('maps messages slice from store', () => {
      const state = {
        messages: {
          loading: true,
          error: false,
          messages: {messages: [createMessage()], total: 1},
          action: {id: 1},
        },
      };

      expect(mapStateToProps(state)).toEqual({
        messages: state.messages.messages,
        action: state.messages.action,
        loading: true,
        error: false,
      });
    });

    it('falls back to initial reducer state for missing slice', () => {
      const props = mapStateToProps({});

      expect(props.loading).toBe(false);
      expect(props.messages).toEqual({messages: []});
    });
  });

  describe('render', () => {
    it('renders loader while loading', () => {
      const {getByTestId, queryByTestId} = render(
        <MessageList {...createProps({loading: true})} />,
      );

      expect(getByTestId('loader')).toBeTruthy();
      expect(queryByTestId('compose')).toBeNull();
    });

    it('renders greeting for empty messages', () => {
      window.__arsfShowGreetings = true;
      const {container, getByTestId} = render(
        <MessageList {...createProps()} />,
      );

      expect(getByTestId('styled-MessageList')).toBeTruthy();
      expect(getByTestId('compose')).toBeTruthy();
      expect(container.querySelector('.greet-message')).toBeTruthy();
      expect(
        container.querySelectorAll('[data-testid="message"]'),
      ).toHaveLength(0);
    });

    it('renders messages when history is present', () => {
      const props = createProps({
        messages: {
          messages: [createMessage({message: 'first'})],
          total: 1,
        },
      });
      const {getByTestId, queryByTestId} = render(<MessageList {...props} />);

      expect(getByTestId('message').textContent).toBe('first');
      expect(queryByTestId('loader')).toBeNull();
      expect(window.__arsfShowGreetings).toBe(false);
    });

    it('shows pagination loader when more messages exist and loading', () => {
      const {getAllByTestId} = render(
        <MessageList
          {...createProps({
            loading: true,
            messages: {messages: [createMessage()], total: 5},
          })}
        />,
      );

      expect(getAllByTestId('loader')).toHaveLength(1);
    });

    it('renders pagination slot without loader when not loading', () => {
      const {container, queryByTestId} = render(
        <MessageList
          {...createProps({
            loading: false,
            messages: {messages: [createMessage()], total: 5},
          })}
        />,
      );

      expect(queryByTestId('loader')).toBeNull();
      expect(container.querySelector('.arsf-message-list')).toBeTruthy();
    });

    it('hides pagination loader when all messages loaded', () => {
      const {queryAllByTestId} = render(
        <MessageList
          {...createProps({
            loading: false,
            messages: {messages: [createMessage(), createMessage()], total: 2},
          })}
        />,
      );

      expect(queryAllByTestId('loader')).toHaveLength(0);
    });
  });

  describe('lifecycle', () => {
    it('registers observer and loads messages on mount', () => {
      const props = createProps();
      render(<MessageList {...props} />);

      expect(observe).toHaveBeenCalledWith('__arsfChatEmmittermess', {
        __arsfChatEmmittermess: expect.any(Function),
      });
      expect(props.getMessages).toHaveBeenCalledWith({mount: 1});
    });

    it('scrolls to bottom on mount', () => {
      const element = setupScrollContainer();
      render(<MessageList {...createProps()} />);

      jest.advanceTimersByTime(100);
      expect(element.scrollTop).toBe(500);
    });

    it('clears messages on unmount', () => {
      const props = createProps();
      const {unmount} = render(<MessageList {...props} />);

      unmount();

      expect(props.clear).toHaveBeenCalled();
    });

    it('scrolls to bottom after update', () => {
      const element = setupScrollContainer();
      const {rerender} = render(<MessageList {...createProps()} />);
      jest.advanceTimersByTime(100);
      element.scrollTop = 0;

      rerender(
        <MessageList
          {...createProps({
            messages: {messages: [createMessage()], total: 1},
          })}
        />,
      );
      jest.advanceTimersByTime(100);

      expect(element.scrollTop).toBe(500);
    });
  });

  describe('getMessages', () => {
    it('routes websocket payload to sendAction', () => {
      const props = createProps();
      const tree = renderer.create(<MessageList {...props} />);
      const instance = tree.getInstance();
      props.getMessages.mockClear();

      instance.getMessages({data: '{"service":"lastmes"}'});

      expect(props.sendAction).toHaveBeenCalledWith({
        message: '{"service":"lastmes"}',
      });
      expect(props.getMessages).not.toHaveBeenCalled();
    });

    it('loads messages when ref is mounted', () => {
      const props = createProps();
      const tree = renderer.create(<MessageList {...props} />);
      const instance = tree.getInstance();
      instance.this$el = {current: document.createElement('div')};
      props.getMessages.mockClear();

      instance.getMessages({offset: 0});

      expect(props.getMessages).toHaveBeenCalledWith({offset: 0});
    });

    it('does not load messages when ref is missing', () => {
      const props = createProps();
      const tree = renderer.create(<MessageList {...props} />);
      const instance = tree.getInstance();
      instance.this$el = {current: null};
      props.getMessages.mockClear();

      instance.getMessages({offset: 0});

      expect(props.getMessages).not.toHaveBeenCalled();
    });

    it('handles empty params as valid load request', () => {
      const props = createProps();
      const tree = renderer.create(<MessageList {...props} />);
      const instance = tree.getInstance();
      instance.this$el = {current: document.createElement('div')};
      props.getMessages.mockClear();

      instance.getMessages();

      expect(props.getMessages).toHaveBeenCalledWith({});
    });
  });

  describe('sendAction', () => {
    it('delegates action payload to props', () => {
      const props = createProps();
      const tree = renderer.create(<MessageList {...props} />);

      tree.getInstance().sendAction({action: 'join', message: 'hello'});

      expect(props.sendAction).toHaveBeenCalledWith({
        action: 'join',
        message: 'hello',
      });
    });
  });

  describe('renderMessages grouping', () => {
    it('marks single message as full sequence with timestamp', () => {
      const {getByTestId} = render(
        <MessageList
          {...createProps({
            messages: {
              messages: [createMessage({message: 'solo'})],
              total: 1,
            },
          })}
        />,
      );

      const node = getByTestId('message');
      expect(node.getAttribute('data-starts')).toBe('true');
      expect(node.getAttribute('data-ends')).toBe('true');
      expect(node.getAttribute('data-timestamp')).toBe('true');
    });

    it('groups consecutive messages from same author within one hour', () => {
      const messages = [
        createMessage({
          message: 'first',
          sender: 'user',
          createdAt: '2026-08-07T10:00:00.000Z',
        }),
        createMessage({
          message: 'second',
          sender: 'user',
          createdAt: '2026-08-07T10:30:00.000Z',
        }),
      ];
      const {getAllByTestId} = render(
        <MessageList {...createProps({messages: {messages, total: 2}})} />,
      );

      const nodes = getAllByTestId('message');
      expect(nodes[0].getAttribute('data-ends')).toBe('false');
      expect(nodes[1].getAttribute('data-starts')).toBe('false');
      expect(nodes[1].getAttribute('data-timestamp')).toBe('false');
    });

    it('starts new sequence after one hour boundary', () => {
      const messages = [
        createMessage({
          message: 'older',
          createdAt: '2026-08-07T09:00:00.000Z',
        }),
        createMessage({
          message: 'newer',
          createdAt: '2026-08-07T10:30:00.000Z',
        }),
      ];
      const {getAllByTestId} = render(
        <MessageList {...createProps({messages: {messages, total: 2}})} />,
      );

      const nodes = getAllByTestId('message');
      expect(nodes[1].getAttribute('data-starts')).toBe('true');
      expect(nodes[1].getAttribute('data-timestamp')).toBe('true');
    });

    it('keeps admin and user messages in separate sequences', () => {
      const messages = [
        createMessage({
          message: 'user msg',
          sender: 'user',
          createdAt: '2026-08-07T10:00:00.000Z',
        }),
        createMessage({
          message: 'admin msg',
          sender: 'admin',
          createdAt: '2026-08-07T10:05:00.000Z',
        }),
      ];
      const {getAllByTestId} = render(
        <MessageList {...createProps({messages: {messages, total: 2}})} />,
      );

      const nodes = getAllByTestId('message');
      expect(nodes[0].getAttribute('data-ends')).toBe('true');
      expect(nodes[1].getAttribute('data-starts')).toBe('true');
    });

    it('skips messages without text content', () => {
      const {queryAllByTestId} = render(
        <MessageList
          {...createProps({
            messages: {
              messages: [
                createMessage({message: ''}),
                createMessage({message: 'ok'}),
              ],
              total: 2,
            },
          })}
        />,
      );

      expect(queryAllByTestId('message')).toHaveLength(1);
    });

    it('handles empty messages array', () => {
      window.__arsfShowGreetings = false;
      const {queryAllByTestId} = render(
        <MessageList
          {...createProps({
            messages: {messages: [], total: 0},
          })}
        />,
      );

      expect(queryAllByTestId('message')).toHaveLength(0);
    });
  });

  describe('scrollBottom error conditions', () => {
    it('does not throw when scroll container is missing', () => {
      document.querySelector = jest.fn(() => null);
      const tree = renderer.create(<MessageList {...createProps()} />);

      expect(() => {
        tree.getInstance().scrollBottom();
        jest.advanceTimersByTime(100);
      }).not.toThrow();
    });
  });

  describe('module exports', () => {
    it('exports MessageList component', () => {
      expect(typeof MessageList).toBe('function');
    });

    it('exposes websocket emitter on window', () => {
      expect(window.__arsfChatEmmitter).toBe(emitData);
    });
  });
});
