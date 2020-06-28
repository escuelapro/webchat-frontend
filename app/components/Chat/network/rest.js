import Storage from 'utils/storage';
import request from 'utils/request';

const restApi = 'test';
const API = process.env.REST_API || restApi;

let API_URL = '';
let API_URL2 = process.env.REST_API;
function* getHeader(userId, rest = false) {
  const token = Storage.get('ctoken');
  return  {
    Authorization: `Bearer ${token}`,
  };
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

export function* addGroups(data) {
  const params = ['model=groups', 'service=avitochat'];
  const url = `v1/objects?${params.join('&')}`;
  return yield reqApi(url, null, data);
}
