import Vue from './instance/index'
import { mountComponent } from './instance/lifecycle';

Vue.prototype.$mount = function(el, hydrating) {
  mountComponent(this, document.querySelector(el), hydrating);
}

// Vue.prototype.__patch__ = ''

export default Vue;