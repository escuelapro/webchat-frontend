import Storage from 'utils/storage';
import request from 'utils/request';

const restApi = 'test';
Storage.set('ctoken', 'test');
const API = process.env.REST_API || restApi;

let API_URL = '';
let API_URL2 = process.env.REST_API;
const isRestApi = window.avitorestRoute;
if (isRestApi) {
  API_URL = `${API}app/messenger/v1/accounts/`;
}
function* getHeader(userId, rest = false) {
  const token = Storage.get('ctoken');
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  return headers;
}

function reqApi(url, userId, postData) {
  return req(url, userId, postData, API);
}

export const docApiUrl = (a) => {
  let db = '';
  return `${a}${a.match(/\?/) ? '&' : '?'}${db ? `db_name=${db}` : ''}`;
};

function* req(url, method, postData, ) {
  let apiUrl = API_URL
  if(url.match('getMessages')){
    apiUrl = API_URL2
  }
  url = `${apiUrl}${url}`;
  url = docApiUrl(url);
  const headers = yield getHeader(method, apiUrl === API);
  if (postData) {
    headers['Content-Type'] = 'application/json';
    headers.Accept = 'application/json';
    headers.Referer = 'http://localhost.dev';
  }
  const options = { headers };
  if (postData) {
    options.method = method || 'POST';
    options.body = JSON.stringify(postData);
  }
  let data;
  try {
    data = yield request(url, options);
  } catch (e) {
    console.log(e);
  }
  return data;
}

export function* getAutoByAvitoId(ids) {
  const params = ['model=auto/auto' /*'run=_hs'*/];
  params.push(`avitoId[]=${ids.join(',')}`);
  const url = `v1/objects?${params.join('&')}`;
  return yield reqApi(url);
}

export function* getChats(userId, params) {
  const url = `${userId}/chats?${params.join('&')}`;
  return yield req(url, userId);
}

export function* getGroups(userId, params = []) {
  params.push(`user_id=${userId}`);
  params.push('model=groups');
  params.push('service=avitochat');
  const url = `v1/objects?${params.join('&')}`;
  return yield reqApi(url);
}

export function* getMessages(userId, params) {
  const url = `/getMessages?user_id=${userId}&${params.join('&')}`;
  return yield req(url);
}

export function* sendMessage(userId, chatId, data) {
  const url = `?user_id=${userId}`;
  return yield req(url, 'POST', data);
}

export function* sendGroup(userId, item = {}) {
  const params = ['model=groups', 'service=avitochat'];
  params.push('check=chatId');
  const url = `v1/objects/?${params.join('&')}`;
  const newItem = { ...item };
  newItem.user_id = userId;
  newItem.service = 'avitochat';
  newItem.chatId = item.id;
  const o = Object.keys(newItem);
  newItem.omit = o;
  return yield reqApi(url, userId, newItem);
}

export function* addGroups(data) {
  const params = ['model=groups', 'service=avitochat'];
  const url = `v1/objects?${params.join('&')}`;
  return yield reqApi(url, null, data);
}

export function* getGroupConversations(params) {
  params = params.concat(['model=groups', 'service=avitochat']);
  const url = `v1/objects?${params.join('&')}`;
  const { items } = yield reqApi(url);
  return items;
}

export function* setSpam(userId, item) {
  const { userId: user_id, chatId: item_id, reasonId: reason_id } = item;
  const url = `${userId}/blacklist`;
  const data = {
    users: [
      {
        user_id,
        context: { item_id, reason_id },
      },
    ],
  };
  return yield req(url, userId, data);
}

export function* setRead(url) {
  const data = { manager_read: true };
  return yield req(url, 'PATCH', data);
}
