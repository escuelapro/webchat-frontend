function parseJSON(response) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }
  return response.json();
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  let { statusText } = response;
  if (!statusText) {
    if (response.status === 403) {
      statusText = 'Forbidden';
    }
    if (response.status === 401) {
      statusText = 'Unauthorized';
    }
  }
  const error = new Error(statusText);
  error.response = response;
  throw error;
}

export default function request(url, options) {
  return fetch(url, options).then(checkStatus).then(parseJSON);
}
