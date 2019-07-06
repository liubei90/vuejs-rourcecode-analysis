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