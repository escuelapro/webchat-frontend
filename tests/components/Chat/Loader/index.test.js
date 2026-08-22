import React from 'react';
import {render, cleanup} from 'react-testing-library';

import Loader from 'components/Chat/Loader';

describe('Chat Loader', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders loader markup', () => {
    const {container} = render(<Loader />);

    expect(container.querySelector('.loader-wrap')).toBeTruthy();
    expect(container.querySelector('.lds-ellipsis')).toBeTruthy();
    expect(container.querySelectorAll('.lds-ellipsis > div')).toHaveLength(4);
  });
});
