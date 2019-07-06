一个vue应用总是通过如下代码启动的
```
import App from './app.vue'

let app = new Vue({
  el: '#app',
  render(h) {
    return h(App)
  }
})

// 或者
let app = new Vue({
  render(h) {
    return h(App)
  }
})

app.$mount('#app')
```

这段代码的含义是，首先通过new操作生成一个Vue对象实例，这个实例的render函数返回一个App组件。app实例被生成后，其内部就已经构建出了自己的dom实例。$mount函数的作用是，将app内部的dom添加到文档上id为app的元素所在dom树的位置，并将原始的dom删除。

app被实例化时做了哪些事情，其内部的dom是如何被创建的，render函数的作用是什么，$mount函数是如何实现挂载的。

app被实例化时做了哪些事情：

```
// core/instance/index.js

import { initMixin } from './init';
import { stateMixin } from './state';
import { eventsMixin } from './events';
import { lifecycleMixin } from './lifecycle';
import { renderMixin } from './render';

export default function Vue(options) {
  this._init(options);
}

initMixin(Vue);
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

// core/instance/init.js
import { initState } from './state';
import { initEvents } from './events';
import { initLifecycle, callHook } from './lifecycle';
import { initRender } from './render';

let uid = 0;

export function initMixin(Vue) {
  Vue.prototype._init = function(options) {
    const vm = this;
    vm._uid = uid++;
    vm._isVue = true;
    vm._self = vm;
    vm.$options = options;

    initLifecycle(vm);
    initEvents(vm);
    initRender(vm);
    callHook(vm, 'beforeCreate');
    initState(vm);
    callHook(vm, 'created');
  }
}
```
vuejs的构造函数会调用一个_init(options)的函数，_init函数里面会调用各个子模块的init函数，这些函数主要是做一些实例属性的初始化工作。其中还可以看到vue的生命周期函数beforeCreate、created的调用时机。


在函数initLifecycle函数中,会初始化$parent,$root,$children,$refs这些公开的属性，还有以下划线开头的内部属性。
```
// core/instance/lifecycle.js

export function initLifecycle(vm) {
  const options = vm.$options;
  const parent = options.parent;
  vm.$parent = parent;
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
```


initState函数会做一些和实例状态有关的操作，主要是对数据的监听，将data，props,computed,method代理到vm实例上。这一块代码算是vuejs的核心代码之一。
```
// core/instance/state.js
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
```


在core/instance/index.js脚本文件中，除了定义了Vue的构造函数，还执行了一些全局混入函数。这些函数主要是向Vue的property中添加了一些全局函数。

initMixin实现了__init函数。

stateMixin函数在Vue原型链上定义了$data, $props, $watch。
```
export function stateMixin(Vue) {
  const dataDef = {
    get: function() { return this._data }
  }
  const propsDef = {
    get: function() { return this._props }
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef);
  Object.defineProperty(Vue.prototype, '$props', propsDef);

  Vue.prototype.$watch = function(expOrFn, cb, options) {
    const vm = this;
    const watcher = new Watcher(vm, expOrFn, cb, options);
    return function() {
      watcher.teardown();
    }
  }
}
```

eventMixin函数在Vue原型链上定义了$on,$once,$off,$emit方法，和事件的注册，反注册，事件触发相关。
```
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
```



lifecycleMixin函数定义了Vue原型链上的_update，$forceUpdate，$destroy函数，主要是和Vue的视图更新操作，实例销毁操作有关。比较重要的是_update函数，这个函数的使用场景会在之后讲到。现在先说一下就是，_update函数的第一个参数vnode就是Vue的render函数的返回值。而且当参与render函数运算的所有被监听的状态数据出现修改，render函数和这个_update函数都会被重新执行。
_update函数调用了__patch__函数，第一个参数是一个dom元素或者一个旧的vnode对象，第二个参数是新计算出来的vnode对象，返回一个新的dom元素。这个__patch__函数将是后面章节讲解的重点，涉及到vnode树的构建，vnode如何创建真实的dom元素，dom元素复用等。
```
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
```


renderMixin函数中定义了Vue原型链上的_render函数，_render函数的作用是执行vue的render函数，并返回结果。由于在mountComponent函数中，这个_render函数和上面的_update会组合成一个Watcher实例，_render函数在执行中，所有用到的vue实例相关的状态数据都生成一个依赖，并注册到这个Watcher实例上。当状态数据发生改变，这个_render函数和_update函数会被重新执行。**这就是Vue的脏值检测机制和双向数据绑定的基础。也就是为什么我们只要修改Vue的状态数据的值，就能自动进行视图更新的原理**
```
export function renderMixin(Vue) {
  Vue.prototype.$nextTick = function(fn) {
    nextTick(fn, this);
  };

  Vue.prototype._render = function() {
    const vm = this;
    const { render } = vm.$options;
    const vnode = render.call(vm, vm.$createElement);
    return vnode;
  }
}
```

上面的代码是new Vue()这句代码调用后执行的所有操作了，主要的作用是初始化所有的实例属性，对实例的状态数据进行处理，为其添加响应式的功能。此时如果没有进行mount操作，是不会调用render函数和_update函数。也就是vm.$el还不存在。

$mount函数执行时会运行render函数生成vnode，运行_update函数生成vnode对应的dom元素。如果有挂载点传入，还将会替换挂载点元素。在代码中还有beforeMount，mounted，beforeUpdate这些生命周期钩子调用的时机 
```
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
```


这一节主要实现了一个Vue对象实例时的整个初始化过程，和大部分Vue原型链上的属性。还知道Vue实现双向数据绑定的基础。下一节会讲到Vue中关于component的知识，有关component和Vue实例的异同点。一个Vue实例中的component树是如何构建及构建出来的数据结构是如何。一个component和其内部的原生元素的关系，和其子component的关系。component之间如何通信的。