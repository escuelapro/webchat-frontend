import { useEffect, useRef, useReducer, useMemo, useCallback } from 'react';
import { runSaga, stdChannel } from 'redux-saga';

export function useReducerAndSaga(reducer, initialState, rootSaga) {
  const [state, reactDispatch] = useReducer(reducer, initialState);
  const env = useRef(state);
  env.current = state;
  const channel = useMemo(() => stdChannel(), []);
  const dispatch = useCallback(a => {
    setImmediate(channel.put, a);
    reactDispatch(a);
  }, []);
  const getState = useCallback(() => env.current, []);

  useEffect(() => {
    const task = runSaga({ channel, dispatch, getState }, rootSaga);
    return () => task.cancel();
  }, []);

  return [state, dispatch];
}
