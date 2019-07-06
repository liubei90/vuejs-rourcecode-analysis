import Watcher from "../observer/watcher";

export function lifecycleMixin(Vue) {
  Vue.prototype._update = function(vnode, hydrating) {
    const vm = this;
    const prevEl = vm.$el;
    const prevVnode = vm._vnode;
    vm._vnode = vnode;
    if (!prevVnode) {
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, true);
    } else {
      vm.$el = vm.__patch__(prevVnode, vnode);
    }
  }

  Vue.prototype.$forceUpdate = function() {
    const vm = this;
    if (vm._watcher) {
      vm._watcher.update();
    }
  }

  Vue.prototype.$destroy = function() {
    const vm = this;
    callHook(vm, 'beforeDestroy');
    if (vm._watcher) {
      vm._watcher.teardown();
    }

    let i = vm._watchers.length;
    while(i--) {
      vm._watchers[i].teardown();
    }
    vm.__patch__(vm._vnode, null);
    callHook(vm, 'destroyed');
    vm.$off();
  }
}

export function initLifecycle(vm) {
  const options = vm.$options;
  const parent = options.parent;
  vm.parent = parent;
  vm.$root = parent ? parent.$root : vm;
  vm.$children = [];
  vm.$refs = {};

  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}

export function callHook(vm, hook) {
  const handlers = vm.$options[hook];
  if (handlers) {
    for (let i = 0; i < handlers.length; i++) {
      handlers.call(vm)
    }
  }
}

export function mountComponent(vm, el, hydrating) {
  vm.$el = el;
  callHook(vm, 'beforeMount');

  const updateComponent = () => {
    vm._update(vm._render(), hydrating);
  }

  new Watcher(vm, updateComponent, () => {}, {
    before() {
      callHook(vm, 'beforeUpdate');
    }
  });

  callHook(vm, 'mounted');
  return vm;
}