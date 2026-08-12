/* eslint-disable no-underscore-dangle */
import React from 'react';
import {render, cleanup} from 'react-testing-library';

import Message from 'components/Chat/Message';

jest.mock('components/Chat/styled', () => {
  // eslint-disable-next-line global-require
  const ReactMock = require('react');
  return {
    __esModule: true,
    default: () => ({children, ...rest}) =>
      ReactMock.createElement(
        'div',
        {'data-testid': 'styled-Message', ...rest},
        children,
      ),
  };
});

describe('Chat Message', () => {
  afterEach(() => {
    cleanup();
  });

  it('returns null when message text is empty', () => {
    const {container} = render(
      <Message
        data={{
          message: '',
          sender: 'user',
          createdAt: '2026-08-12T10:00:00.000Z',
        }}
        startsSequence
        endsSequence
        showTimestamp
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders user message with mine class', () => {
    const {container, getByText} = render(
      <Message
        data={{
          message: '  hello  ',
          sender: 'user',
          createdAt: '2026-08-12T10:00:00.000Z',
        }}
        startsSequence
        endsSequence
        showTimestamp
      />,
    );

    expect(getByText('hello')).toBeTruthy();
    expect(
      container.querySelector('.arsf-message.mine.start.end'),
    ).toBeTruthy();
    expect(container.querySelector('.timestamp')).toBeTruthy();
    expect(container.querySelector('.time .right')).toBeTruthy();
  });

  it('renders admin message without mine class and hides timestamp when disabled', () => {
    const {container, getByText} = render(
      <Message
        data={{
          message: 'support reply',
          sender: 'admin',
          createdAt: '2026-08-12T11:00:00.000Z',
        }}
        startsSequence={false}
        endsSequence={false}
        showTimestamp={false}
      />,
    );

    expect(getByText('support reply')).toBeTruthy();
    expect(container.querySelector('.arsf-message.mine')).toBeNull();
    expect(container.querySelector('.timestamp')).toBeNull();
    expect(container.querySelector('.time .left')).toBeTruthy();
  });
});
