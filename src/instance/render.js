import { nextTick } from '../util/next-tick';
import { defineReactive } from "../observer";

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

export function initRender(vm) {
  const options = vm.$options;
  const parentVnode = vm.$vnode = options._parentVnode;
  const renderContext = parentVnode && parentVnode.context;

  vm.$slots = resolveSlots(options._renderChildren, renderContext);
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true);
  
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false);
  vm._vnode = null;
  vm._staticTrees = null;

  // const parentData = parentVnode && parentVnode.data;
  // defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
  // defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
}