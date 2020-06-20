let observers = {};
let data = '';
let observerName = '';

function emitChange(method, title = '') {
  try {
    if (observers[observerName] && observers[observerName][method]) {
      observers[observerName][method](data, title);
    }
  } catch (e) {
    console.warn(e);
  }
}

export default function observe(name, listeners) {
  observers[name] = listeners;
  emitChange();
  return () => {
    observers = null;
  };
}

export function emitData(type, val, title) {
  observerName = type;
  data = val;
  emitChange(type, title);
}
