import {put, takeLatest} from 'redux-saga/effects';
import {parseQuery} from 'utils/request';
import Storage from 'utils/storage';
import {
  MESS_LIMIT,
  logger,
} from '../network';

let lastMessageId = '';
let scrollEnd = false;
let lastLocation = '';
let lastOffset = 0;

export function* getData(params) {
  try {
    if (!connected) {
      connect();
      connected += 1;
    }
    let offset = 0;
    const {isScroll, isNewMessage} = params;
    const pq = parseQuery();
    let {userId = 1, actions} = pq;
    if (window.location.href.match(/client\/([0-9]+)\//)) {
      userId = window.location.href.match(/client\/([0-9]+)\//)[1];
    }
    const isNew = userId !== lastLocation;
    if (isNew) {
      lastOffset = 0;
    }
    if (isNew) {
      scrollEnd = false;
    }
    if (lastOffset > 0) {
      offset = lastOffset;
    }
    if (isNewMessage) {
      offset = 0;
      lastOffset = 0;
    }
    if (isScroll) {
      offset += MESS_LIMIT;
    }
    if (scrollEnd) {
      return;
    }
    lastLocation = userId;

    if (isScroll || actions) {
      return;
    }

    if (userId) {
      const params = [`page_size=${MESS_LIMIT}`];
      if (offset) {
        params.push(`page=${offset}`);
      }
    }
  } catch (error) {
    logger(error);
    yield put({type: 'messages_error', error});
  }
}

let connected = 0;
const connect = (rec = false) => {
  let wss = 'wss';
  if (process.env.NODE_ENV === 'development') wss = 'ws';
  var cc = new WebSocket(`${wss}://${window.__arsfChatUrl || process.env.WS_URI}/`);
  window.__arsfChat = cc;
  if (!window.__arsfChatIdg) window.__arsfChatIdg = 2;

  cc.onopen = () => {
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

/**
 * Root saga manages watcher lifecycle
 */
export default function* saga() {
  yield takeLatest('messages_load', getData);
  yield takeLatest('send_action', sendGroupAction);
  yield takeLatest('scroll_mess', getData);
  yield takeLatest('messages_test', newMessage);
}
