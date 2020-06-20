function toInt(v) {
  let inVal = parseInt(v, 10);
  if (isNaN(inVal)) {
    inVal = 0;
  }
  return inVal;
}

class Storage {
  _(k, def) {
    let v = localStorage.getItem(k);
    if (v && v.match(/^{/)) {
      v = JSON.parse(v);
    }
    return v || def;
  }

  __(k, v) {
    return localStorage.setItem(k, v);
  }

  rm(k) {
    return localStorage.removeItem(k);
  }

  get(k, def) {
    return this._(k, def);
  }

  set(k, v) {
    return this.__(k, v);
  }

  clear() {
    return localStorage.clear();
  }

  getInt(key) {
    return toInt(this._(key, 0));
  }

  inc(key, val) {
    let v = this.getInt(key);
    v += toInt(val);
    return this.set(key, v);
  }

  sessionClear() {
    const var1 = sessionStorage.getItem('isDup');
    const var2 = sessionStorage.getItem('tabID');
    sessionStorage.clear();
    sessionStorage.setItem('isDup', var1);
    sessionStorage.setItem('tabID', var2);
    const unreadNotify = document.getElementById('unreadNotify');
    if (unreadNotify) {
      unreadNotify.classList.remove('blink_me');
      unreadNotify.innerText = '';
    }
  }

  resetFilter(filterName = window.location.pathname) {
    Object.keys(localStorage).
      filter(i => i.match(`autocomplete_${filterName}`)).
      map(k => this.rm(k));
  }
}

export default new Storage();
