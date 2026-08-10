import appReducer, {initialState} from 'containers/App/reducer';
import {
  LOAD_REPOS,
  LOAD_REPOS_SUCCESS,
  LOAD_REPOS_ERROR,
} from 'containers/App/constants';

describe('App reducer', () => {
  it('returns initial state for unknown action', () => {
    expect(appReducer(undefined, {type: 'UNKNOWN'})).toEqual(initialState);
  });

  it('sets loading state on LOAD_REPOS', () => {
    const state = {
      ...initialState,
      error: true,
      userData: {repositories: [{id: 1}]},
    };

    const next = appReducer(state, {type: LOAD_REPOS});

    expect(next.loading).toBe(true);
    expect(next.error).toBe(false);
    expect(next.userData.repositories).toBe(false);
  });

  it('stores repositories on LOAD_REPOS_SUCCESS', () => {
    const repos = [{id: 1, name: 'repo-a'}];
    const next = appReducer(initialState, {
      type: LOAD_REPOS_SUCCESS,
      repos,
      username: 'alice',
    });

    expect(next.loading).toBe(false);
    expect(next.currentUser).toBe('alice');
    expect(next.userData.repositories).toEqual(repos);
  });

  it('stores error on LOAD_REPOS_ERROR', () => {
    const error = new Error('Failed to load repos');
    const next = appReducer(initialState, {
      type: LOAD_REPOS_ERROR,
      error,
    });

    expect(next.loading).toBe(false);
    expect(next.error).toBe(error);
  });
});
