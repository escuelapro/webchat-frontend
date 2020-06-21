import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import history from 'utils/history';
import configureStore from './utils/configureStore';
import Chat from './pages/Chat/Loadable';
import './assets/style.css'

const initialState = {};
const store = configureStore(initialState, history);

let adminMaximumAppInit = selector => {
  ReactDOM.render(
    <Provider store={store}>
      <Chat/>
    </Provider>,
    selector,
  );
};
let MOUNT_NODE = document.getElementById('apppopupmax');
if (!MOUNT_NODE) {
  MOUNT_NODE = document.getElementById('apppopupmax122');
}
if (MOUNT_NODE) {
  adminMaximumAppInit(MOUNT_NODE);
}
