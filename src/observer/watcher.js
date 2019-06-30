import { pushTarget, popTarget } from './dep';

let uid = 0;

export default class Watcher {
  deps;
  value;
  vm;
  expOrFn;
  cb;
  options;


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

  get() {
    pushTarget(this);
    const vm = this.vm;
    let value = this.getter.call(vm, vm);
    popTarget();
    return value;
  }

  run() {
    const value = this.get();
    if (value !== this.value) {
      const vm = this.vm;
      const oldValue = this.value;
      this.value = value;
      this.cb.call(vm, value, oldValue);
    }
  }

  addDep(dep) {
    this.deps.push(dep);
    dep.addSub(this);
  }

  update() {
    this.run();
    // console.log('update', this.value);
  }

  teardown() {
    let i = this.deps.length;
    while(i--) {
      this.deps[i].removeSub(this);
    }
  }
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