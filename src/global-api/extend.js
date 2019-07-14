import { ASSET_TYPES } from '../constants';
import { mergeOptions } from '../util/options';

export function initExtend(Vue) {
  let cid = 0;
  Vue.extend = function(extendOptions = {}) {
    const Super = this;
    const name = extendOptions.name;
    const Sub = function(options) {
      this.__init(options);
    }
    Sub.prototype = Object.create(Super.prototype);
    Sub.prototype.constructor = Sub;
    Sub.cid = cid++;
    Sub.options = mergeOptions(
      Super.options, extendOptions
    );
    Sub['super'] = Super;
    Sub.extend = Super.extend;
    Sub.superOptions = Super.options;
    Sub.extendOptions = extendOptions;
    Sub.sealedOptions = extend({}, Sub.options);

    ASSET_TYPES.forEach(asset => {
      Sub[asset] = Super[asset];
    });

    return Sub;
  }
}