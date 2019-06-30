*src/core/observer/*

vue的核心特征就是mvvm,数据的变化会实时反应到相关联的视图上去。这个过程通过vm这一层自动处理。

vue实现vm的核心知识点就是Object.defineProperty。通过观察者模式将数据的改变通知所有依赖该数据的观察者。这里的数据就是options中的data和props对象，使用this.$set设置的属性。观察者是options中的watch对象和computed对象。

核心代码如下
```
// dep.js
let uid = 0;

export default class Dep {
  static target;
  id;
  subs;

  constructor() {
    this.id = uid++;
    this.subs = [];
  }

  addSub(sub) {
    this.subs.push(sub);
  }

  removeSub(sub) {
    const subs = this.subs;
    if (subs.length) {
      const index = subs.indexOf(sub);
      if (index > -1) {
        subs.splice(index, 1);
      }
    }
  }

  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }

  notify() {
    const subs = this.subs.slice();
    for (let i = 0; i < subs.length; i++) {
      subs[i].update();
    }
  }
}

// watcher.js
export default class Watcher {
  deps;
  value;

  constructor(value) {
    this.deps = [];
    this.value = value;
  }

  addDep(dep) {
    this.deps.push(dep);
    dep.addSub(this);
  }

  update() {
    console.log('update', this.value);
  }

  teardown() {
    let i = this.deps.length;
    while(i--) {
      this.deps[i].removeSub(this);
    }
  }
}
```

在运行时调用new Vue()，会执行初始化操作，其中的initState会处理options中的props, methods, data, computed, watch。其中的pros和data对应Dep，computed和watch对应Watcher。初始化时props和data的dep会保存自己所依赖的watcher，当props和data中的值发生改变，就通知computed和watcher执行。

```
// state.js

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

Vue.prototype.$watch = function(expOrFn, cb, options) {
  const vm = this;
  const watcher = new Watcher(vm, expOrFn, cb, options);
  return function() {
    watcher.teardown();
  }
}


// observer/index.js
export function defineReactive(obj, key) {
  const property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return;
  }

  let val = obj[key];
  const dep = new Dep();
  const getter = property.get;
  const setter = property.set;
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function() {
      const value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
      }
      return value;
    },
    set: function(newVal) {
      const value = getter ? getter.call(obj) : val;
      if (value === newVal || (newVal !== newVal && value !== value)) {
        return;
      }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      dep.notify();
    }
  })

}

```

vue实现监听数据的改变，就是在defineReactive函数内。通过Object.defineProperty为需要监听的对象属性设置get和set。
当进行computed运算或者创建watch时，computed和watch相关的Watcher对象就保存在Dep.target变量中。
此时如果有data中的数据被使用，会调用数据的get函数，通过get函数将数据相关的dep对象和Dep.target这个Watcher联系起来。当数据被修改时，set函数会被调用，data相关的dep的notify函数被调用。其所有相联系的watcher对象的update函数都会执行。

除了核心的代码，这里还涉及了Vue对data的访问代理，在options中的watch对象和使用this.$watch()函数时Watcher对象收集依赖方式的不同。

```
// state.js
function initData(vm) {
  let data = vm.$options.data;
  data = vm._data = typeof data === 'function' ? getData(vm, data) : data || {};

  const keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    proxy(vm, '_data', keys[i]);
  }
  observe(data, true);
}

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

// watcher.js
constructor(vm, expOrFn, cb, options) {
  this.deps = [];
  // this.value = value;
  this.vm = vm;
  this.id = uid++;
  this.cb = cb;
  if (typeof expOrFn === 'function') {
    this.getter = expOrFn;
  } else {
    this.getter = parsePath(expOrFn);
  }
  this.value = this.get();
}

function parsePath(path) {
  const segments = path.split('.');
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return;
      obj = obj[segments[i]];
    }
    return obj;
  }
}
```
