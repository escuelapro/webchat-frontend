import {put, takeLatest} from 'redux-saga/effects';
import Storage from 'utils/storage';
import {logger} from '../network';

let lastMessageId = '';
let scrollEnd = false;
let lastLocation = '';
let lastOffset = 0;
let connected = 0;
let _rec = false;

export function* clear(params) {
  lastMessageId = '';
  scrollEnd = false;
  lastLocation = '';
  lastOffset = 0;
  connected = 0;
  _rec = true;
}

export function* getData(params) {
  try {
    //console.log('connected', connected);
    if (!connected) {
      connect(_rec);
      connected += 1;
    }
    const {isScroll, isNewMessage} = params;
    let userId = 1;
    const isNew = userId !== lastLocation;
    if (isNew) {
      lastOffset = 0;
    }
    if (isNew) {
      scrollEnd = false;
    }
    if (isNewMessage) {
      lastOffset = 0;
    }
    if (scrollEnd) {
      return;
    }
    lastLocation = userId;
  } catch (error) {
    logger(error);
    yield put({type: 'messages_error', error});
  }
}

const connect = (rec = false) => {
  let wss = 'wss';
  if (process.env.NODE_ENV === 'development') wss = 'ws';
  let cc = new WebSocket(`${wss}://${window.__arsfChatUrl || process.env.WS_URI}/`);
  window.__arsfChat = cc;
  if (!window.__arsfChatIdg) window.__arsfChatIdg = 2;

  cc.onopen = () => {
    _rec = false;
    if (!rec) {
      console.log(`room ${window.__arsfChatIdg}`);
      let message = {message: 'hi', login: 1};
      message.host = window.location.host;
      message.pathname = window.location.pathname;
      if (window.__arsfChatIdg) {
        message.g = window.__arsfChatIdg;
      }
      message.uid = getUid();
      if (window.__arsfChatIdu) {
        message.u = window.__arsfChatIdu;
      }
      window.__arsfChat.send(JSON.stringify(message));
    }
  };
  if (window.__arsfChat) window.__arsfChat.addEventListener('message', (event) => {
    if (window.__arsfChatEmmitter) window.__arsfChatEmmitter('__arsfChatEmmittermess', event);
  });
  cc.onclose = function (e) {
    setTimeout(function () {
      connect(true);
      connected += 1;
    }, 1000);
  };
};

function getUid() {
  let u = Storage.get('instantChatBotUidNameStored');
  if (u) {
    return u;
  }
  return window.instantChatBotUidName;
}

export function* newMessage({text}) {
  try {
    const message = {message: text};
    if (!text) {
      logger('empty mess');
      return;
    }
    message.host = window.location.host;
    message.pathname = window.location.pathname;
    if (window.__arsfChatIdg) {
      message.g = window.__arsfChatIdg;
    }
    if (window.__arsfChatIdu) {
      message.u = window.__arsfChatIdu;
    }
    message.uid = getUid();
    message.isRec = connected > 0;
    window.__arsfChat.send(JSON.stringify(message));
    window.__arsfShowGreetings = false;
    yield put({type: 'messages_success', data: [message]});
    let data;

    if (data) {
      lastMessageId = data.id;
    }
  } catch (e) {
    logger(e);
  }
}

export function* sendGroupAction(params) {
  try {
    let {message} = params;
    message = {message};
    try {
      const mess = JSON.parse(message.message);
      if (typeof mess === 'object') {
        message = mess;
      }
    } catch (e) {
      logger(e);
    }
    logger(message);
    if (message.service) {
      if (message.service === 'setUid') {
        if (!window.instantChatBotUidName) {
          window.instantChatBotUidName = message.message;
          Storage.set('instantChatBotUidNameStored', message.message);
        }
        if (message.lastMess && message.lastMess.length) {
          yield put({type: 'messages_success', data: message.lastMess});
        }
      }
    } else {
      if (connected > 1 && message.greeting) {
      } else {
        message.sender = 'admin';
        yield put({type: 'messages_success', data: [message]});
      }
    }
  } catch (e) {
    logger(e);
  }
}

export default function* saga() {
  yield takeLatest('messages_clear', clear);
  yield takeLatest('messages_load', getData);
  yield takeLatest('send_action', sendGroupAction);
  yield takeLatest('scroll_mess', getData);
  yield takeLatest('messages_test', newMessage);
}
