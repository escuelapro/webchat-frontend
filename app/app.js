import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import history from 'utils/history';
import configureStore from './utils/configureStore';
import Chat from './pages/Chat/Loadable';

const initialState = {};
const store = configureStore(initialState, history);

let adminMaximumAppInit = config => {
  ReactDOM.render(
  <Provider store={store}>
    <Chat/>
    </Provider>,
  config.elem || config.selector,
);
};
if (window.onAppMounted && !process.env.VERSION) {
  window.onAppMounted(adminMaximumAppInit);
} else {
  let MOUNT_NODE = document.getElementById('apppopupmax');
  if (!MOUNT_NODE) {
    MOUNT_NODE = document.getElementById('apppopupmax122');
  }
  if (MOUNT_NODE) {
    adminMaximumAppInit({ selector: MOUNT_NODE });
  }
}
