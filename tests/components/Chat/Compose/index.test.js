/* eslint-disable no-underscore-dangle */
import React from 'react';
import renderer from 'react-test-renderer';
import {cleanup, fireEvent, render} from 'react-testing-library';

import observe, {emitData} from 'utils/observers';
import Compose, {mapDispatchToProps} from 'components/Chat/Compose';

jest.mock('react', () => {
  const ActualReact = jest.requireActual('react');
  return {
    ...ActualReact,
    memo: component => component,
  };
});

jest.mock('utils/injectSaga', () => () => Component => Component);
jest.mock('react-redux', () => ({
  connect: (_mapState, mapDispatch) => {
    global.__composeMapDispatchToProps = mapDispatch;
    return Component => Component;
  },
}));

jest.mock('utils/observers', () => ({
  __esModule: true,
  default: jest.fn(),
  emitData: jest.fn(),
}));

jest.mock('components/Chat/styled', () => {
  // eslint-disable-next-line global-require
  const ReactMock = require('react');
  return {
    __esModule: true,
    default: () => ({children, ...rest}) =>
      ReactMock.createElement(
        'div',
        {'data-testid': 'styled-Compose', ...rest},
        children,
      ),
  };
});

jest.mock('components/Chat/Compose/saga', () => ({
  __esModule: true,
  default: function* saga() {
    yield undefined;
  },
}));

describe('Chat Compose', () => {
  beforeEach(() => {
    // Module import initializes emitter once; keep a callable stub for constructors.
    if (typeof window.__arsfChatEmmitter !== 'function') {
      window.__arsfChatEmmitter = txt => {
        emitData('__arsfChatEmmitter', txt);
      };
    }
    observe.mockReset();
    emitData.mockReset();
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe('mapDispatchToProps', () => {
    it('dispatches messages_test with text and userId', () => {
      const dispatch = jest.fn();
      const {send} = mapDispatchToProps(dispatch);

      send('hello', 'user-1');

      expect(dispatch).toHaveBeenCalledWith({
        type: 'messages_test',
        text: 'hello',
        userId: 'user-1',
      });
    });
  });

  describe('module side effects', () => {
    it('exposes window.__arsfChatEmmitter that forwards to emitData', () => {
      expect(typeof window.__arsfChatEmmitter).toBe('function');

      window.__arsfChatEmmitter('payload');

      expect(emitData).toHaveBeenCalledWith('__arsfChatEmmitter', 'payload');
    });
  });

  describe('component behavior', () => {
    it('registers observer on mount and cleans up on unmount', () => {
      const props = {send: jest.fn()};
      const {unmount} = render(<Compose {...props} />);

      expect(observe).toHaveBeenCalledWith('__arsfChatEmmitter', {
        __arsfChatEmmitter: expect.any(Function),
      });

      unmount();

      expect(observe).toHaveBeenCalledWith(null);
    });

    it('sends trimmed text from button click and clears textarea', () => {
      const props = {send: jest.fn()};
      const {container} = render(<Compose {...props} />);
      const textarea = container.querySelector('textarea');
      const button = container.querySelector('button.send-btn');

      textarea.value = '  hello world  ';
      fireEvent.click(button);

      expect(props.send).toHaveBeenCalledWith('hello world');
      expect(textarea.value).toBe('');
    });

    it('does not send empty text', () => {
      const props = {send: jest.fn()};
      const {container} = render(<Compose {...props} />);
      const textarea = container.querySelector('textarea');
      const button = container.querySelector('button.send-btn');

      textarea.value = '   ';
      fireEvent.click(button);

      expect(props.send).not.toHaveBeenCalled();
      expect(textarea.value).toBe('');
    });

    it('sends on Enter without modifiers', () => {
      const props = {send: jest.fn()};
      const {container} = render(<Compose {...props} />);
      const textarea = container.querySelector('textarea');

      textarea.value = 'ping';
      fireEvent.keyDown(textarea, {key: 'Enter', keyCode: 13});

      expect(props.send).toHaveBeenCalledWith('ping');
    });

    it('does not send on Enter with Shift', () => {
      const props = {send: jest.fn()};
      const {container} = render(<Compose {...props} />);
      const textarea = container.querySelector('textarea');

      textarea.value = 'ping';
      fireEvent.keyDown(textarea, {key: 'Enter', keyCode: 13, shiftKey: true});

      expect(props.send).not.toHaveBeenCalled();
    });

    it('prevents default form submit', () => {
      const props = {send: jest.fn()};
      const tree = renderer.create(<Compose {...props} />);
      const instance = tree.getInstance();
      const event = {preventDefault: jest.fn()};

      expect(instance.test(event)).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });
});
