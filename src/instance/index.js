import { initMixin } from './init';
import { stateMixin } from './state';

export default function Vue(options) {
  this._init(options);
}

initMixin(Vue);
stateMixin(Vue);