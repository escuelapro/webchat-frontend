/* eslint-disable no-underscore-dangle */
import React from 'react';
import {cleanup, fireEvent, render} from 'react-testing-library';

import observe, {emitData} from 'utils/observers';
import HomePage from 'pages/Chat';

jest.mock('react', () => {
  const ActualReact = jest.requireActual('react');
  return {
    ...ActualReact,
    memo: component => component,
  };
});

jest.mock('components/Chat/App', () => {
  // eslint-disable-next-line global-require
  const ReactMock = require('react');
  return props =>
    ReactMock.createElement('div', {
      'data-testid': 'chat-app',
      'data-params': JSON.stringify(props.params),
    });
});

jest.mock('pages/Chat/styled', () => {
  // eslint-disable-next-line global-require
  const ReactMock = require('react');
  return {
    __esModule: true,
    default: () => ({children, ...rest}) =>
      ReactMock.createElement(
        'div',
        {'data-testid': 'styled-Page', ...rest},
        children,
      ),
  };
});

jest.mock('utils/observers', () => ({
  __esModule: true,
  default: jest.fn(),
  emitData: jest.fn(),
}));

describe('pages/Chat HomePage', () => {
  beforeEach(() => {
    observe.mockReset();
    emitData.mockReset();
    // Keep module-defined open/close so those branches stay covered.
    window.instantChatBot.show = false;
    delete window.instantChatBotUidName;
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('registers observer on mount and shows support button by default', () => {
    const {container, queryByTestId} = render(<HomePage params={{a: 1}} />);

    expect(observe).toHaveBeenCalledWith('instantChatBotEvents', {
      instantChatBotEvents: expect.any(Function),
    });
    expect(container.querySelector('.msger-button')).toBeTruthy();
    expect(queryByTestId('chat-app')).toBeNull();
  });

  it('opens chat via button click and emits open event', () => {
    const {container, getByTestId} = render(<HomePage params={{uid: 'u1'}} />);
    const listener = observe.mock.calls[0][1].instantChatBotEvents;

    fireEvent.click(container.querySelector('.msger-button'));

    expect(emitData).toHaveBeenCalledWith('instantChatBotEvents', {open: true});
    listener({open: true});

    expect(getByTestId('chat-app').getAttribute('data-params')).toBe(
      JSON.stringify({uid: 'u1'}),
    );
    expect(container.querySelector('.close-btn')).toBeTruthy();
  });

  it('closes chat via close button', () => {
    const {container, queryByTestId} = render(<HomePage params={{}} />);
    const listener = observe.mock.calls[0][1].instantChatBotEvents;

    fireEvent.click(container.querySelector('.msger-button'));
    listener({open: true});
    fireEvent.click(container.querySelector('.close-btn'));
    listener({open: false});

    expect(emitData).toHaveBeenCalledWith('instantChatBotEvents', {
      open: false,
    });
    expect(queryByTestId('chat-app')).toBeNull();
    expect(container.querySelector('.msger-button')).toBeTruthy();
  });

  it('close(true) removes instantChatBotUidName', () => {
    window.instantChatBotUidName = 'uid-stored';

    window.instantChatBot.close(true);

    expect(window.instantChatBotUidName).toBeUndefined();
    expect(window.instantChatBot.show).toBe(false);
    expect(emitData).toHaveBeenCalledWith('instantChatBotEvents', {
      open: false,
    });
  });
});
