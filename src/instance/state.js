import { observe } from '../observer';
import Watcher from '../observer/watcher';

export function proxy(target, sourceKey, key) {
  const sharedProperty = {
    enumerable: true,
    configurable: true,
    get: function() {
      return this[sourceKey][key];
    },
    set: function(val) {
      this[sourceKey][key] = val;
    }
  }
  Object.defineProperty(target, key, sharedProperty);
}

export function initState(vm) {
  const opt = vm.$options;
  if (opt.props) initProps(vm, opt.props);
  if (opt.methods) initMethods(vm, opt.methods);
  if (opt.data) {
    initData(vm);
  } else {
    ;
  }
  if (opt.computed) initComputed(vm, opt.computed);
  if (opt.watch) initWatch(vm, opt.watch);
}

function initProps() {
  ;
}

function initMethods() {
  ;
}

function initData(vm) {
  let data = vm.$options.data;
  data = vm._data = typeof data === 'function' ? getData(vm, data) : data || {};

  const keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    proxy(vm, '_data', keys[i]);
  }
  observe(data, true);
}

function getData(vm, data) {
  return data.call(vm, vm);
}

function initComputed(vm, computed) {
  ;
}

function initWatch(vm, watch) {
  for (const key in watch) {
    const handler = watch[key];
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher(vm, expOrFn, handler, options) {
  if (typeof handler === 'string') {
    handler = vm[handler];
  }
  return vm.$watch(expOrFn, handler, options);
}

export function stateMixin(Vue) {
  const dataDef = {
    get: function() { return this._data }
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef);

  Vue.prototype.$watch = function(expOrFn, cb, options) {
    const vm = this;
    const watcher = new Watcher(vm, expOrFn, cb, options);
    return function() {
      watcher.teardown();
    }
  }
}