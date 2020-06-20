/**
 * Parses the JSON returned by a network request
 *
 * @param  {object} response A response from a network request
 *
 * @return {object}          The parsed JSON from the request
 */
function parseJSON(response) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }
  return response.json();
}

/**
 * Checks if a network request came back fine, and throws an error if not
 *
 * @param  {object} response   A response from a network request
 *
 * @return {object|undefined} Returns either the response, or throws an error
 */
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

const parseQuery = (str, decode = false) => {
  const strParams = (str || window.location.search).replace(/(^\?)/, '');
  if (strParams.length) {
    const set = (el, n) => {
      let k = decode ? decodeURIComponent(n[0]) : n[0];
      const v = decode ? decodeURIComponent(n[1]) : n[1];
      const array1 = k.match(/(.*?)\[(.*?)\]/);
      if (array1 && array1[2] && !isNaN(parseInt(array1[2]))) {
        k = array1[1];
      }
      if (el[k] && !Array.isArray(el[k])) {
        el[k] = [el[k]];
      }
      return el[k] && Array.isArray(el[k]) ? el[k].push(v) : el[k] = v;
    };
    return strParams.split('&').map(function(n) {
      return n = n.split('='), set(this, n), this;
    }.bind({}))[0];
  }
  return false;
};

/**
 * Requests a URL, returning a promise
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 *
 * @return {object}           The response data
 */
export default function request(url, options) {
  return fetch(url, options).then(checkStatus).then(parseJSON);
}
export { parseQuery };
