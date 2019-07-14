import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index';
import { mountComponent } from './instance/lifecycle';

Vue.prototype.$mount = function(el, hydrating) {
  mountComponent(this, document.querySelector(el), hydrating);
}

Vue.options = Object.create(null);
Vue.options.__base = Vue;
initGlobalAPI(Vue);

// Vue.prototype.__patch__ = ''

export default Vue;