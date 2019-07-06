export function eventsMixin(Vue) {
  Vue.prototype.$on = function(event, fn) {
    const vm = this;
    if (!vm._events[event]) {
      vm._events[event] = [];
    }
    vm._events[event].push(fn);
    return vm;
  }

  Vue.prototype.$once = function(event, fn) {
    const vm = this;
    function once() {
      vm.$off(event, fn);
      fn.apply(vm, arguments);
    }
    vm.$on(event, once);
    return vm
  }

  Vue.prototype.$off = function(event, fn) {
    const vm = this;
    const cbs = vm._events[event];

    if (!cbs) {
      return vm;
    }

    if (!fn) {
      vm._events[event] = null;
      return vm;
    }

    let i = cbs.length;
    while(i--) {
      if (cbs[i] === fn) {
        cbs.splice(i, 1);
        break;
      }
    }
    return vm;
  }

  Vue.prototype.$emit = function(event) {
    const vm = this;
    const cbs = vm._events[event];
    if (!cbs) {
      return vm;
    }
    const args = Array.prototype.slice.call(arguments, 1);
    for (let i = 0; i < cbs.length; i++) {
      fn = cbs[i];
      fn.apply(vm, args);
    }
    return vm;
  }
}


export function initEvents(vm) {
  vm._events = Object.create(null);
  vm._hasHookEvent = false;
  // vm.
}

