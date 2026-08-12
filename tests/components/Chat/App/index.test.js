import React from 'react';
import {render, cleanup} from 'react-testing-library';

import App from 'components/Chat/App';

jest.mock('components/Chat/Messenger', () => {
  // eslint-disable-next-line global-require
  const ReactMock = require('react');
  return props =>
    ReactMock.createElement('div', {
      'data-testid': 'messenger',
      'data-userids': JSON.stringify(props.userIds),
    });
});

describe('Chat App', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders Messenger with params as userIds', () => {
    const params = {uid: 'user-1'};
    const {getByTestId} = render(<App params={params} />);

    expect(getByTestId('messenger').getAttribute('data-userids')).toBe(
      JSON.stringify(params),
    );
  });
});
