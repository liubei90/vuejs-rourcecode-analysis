vuejs中的Vue.extend函数用来构造一个新的Vue构造函数，函数参数是一个extendOptions对象，所有可用的Vue实例options都可以传递进去。使用这个函数生成的对象实例拥有和new Vue()生成的实例相同的对象属性和方法。不同的地方是，每个对象实例都会具有extendOptions。也就是在new ExtendVue(options)执行时，这个传入的options会和extendOptions合并，生成vm.$options。

Vue.extend函数的实现代码如下
```
// src/core/global-api/extend.js
import { ASSET_TYPES } from '../constants';

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
```

可以看到，Vue.extend函数返回了一个Sub的构造函数，这个函数原型链是```Sub.prototype = Object.create(Super.prototype);```,所以拥有Vue实例的所有方法。在构造函数中直接调用了```this.__init(options)```，完成了实例的初始化操作。这样就拥有了所有Vue实例的属性。同时一些全局方法也会在此处被赋值。

在Vue的_init函数中，会有合并options和extendOptions的操作。代码如下

```
vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options, vm);

export function resolveConstructorOptions(Ctor) {
  return Ctor.options;
}
```

Vue的真实源码中，对于resolveConstructorOptions函数的实现，会递归判断Super.options是否发生过修改。如果发生了修改，就修复Sub.options。

到了这里，就只有一个问题，mergeOptions到底是如何合并options的，因为我们在使用Vue的时候，可以直观感受到，有些options是可以合并的，比如data,created。而render函数是不能合并的。mergeOptions的代码如下。

```
export function mergeOptions(parent, child, vm) {
  if (child.extends) {
    parent = mergeOptions(parent, child.extends, vm);
  }

  if (child.mixins) {
    for (let i = 0; i < child.mixins.length; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm);
    }
  }

  const options = {};

  for (key in parent) {
    mergeField(key);
  }

  for (key in child) {
    if (!parent.hasOwnProperty(key)) {
      mergeField(key);
    }
  }

  function mergeField(key) {
    const strat = strats[key] || defaultStrat;
    options[key] = strat(parent[key], child[key], vm, key);
  }
  return options;
}
```

可以看到，mergeOptions执行时，会先处理childOptions中的extends和mixins，将他们合并到parentOptions中。
之后遍历parent和child的属性，将他们合并后赋值给最终的结果options。变量strats和defaultStrat就是每个options属性的合并策略。Vue也暴露了一个config.optionMergeStrategies配置项来让我们自定义合并策略。但是这个配置只能用来合并自定义属性。Vue中定义的属性合并策略是不可定制的。

```
const strats = config.optionMergeStrategies || {};
strats.data = function(parentVal, childVal, vm) {
  if (!vm) {
    if (typeof childVal !== 'function') {
      return parentVal;
    }
    return mergeDataOrFn(parentVal, childVal);
  }
  return mergeDataOrFn(parentVal, childVal, vm);
}

export function mergeDataOrFn(parentVal, childVal, vm) {
  if (!vm) {
    return function mergeDataOrFn() {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      );
    }
  } else {
    return function mergedInstanceDataFn() {
      const instanceData = typeof childVal === 'function' ? childVal.call(vm, vm) : childVal;
      const defaultData = typeof parentVal === 'function' ? parentVal.call(vm, vm) : parentVal;
      if (instanceData) {
        return mergeData(instanceData, defaultData);
      } else {
        return defaultData;
      }
    }
  }
}

function mergeData(to, from) {
  const keys = Object.keys(from);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    toVal = to[key];
    fromVal = from[key];
    if (!to.hasOwnProperty(key)) {
      to[key] = fromVal;
    } else if (toVal !== fromVal 
      && isPlainObject(toVal) 
      && isPlainObject(fromVal)) {
      mergeData(toVal, fromVal)
    }
  }
}

const defaultStrat = function (parentVal: any, childVal: any): any {
  return childVal === undefined
    ? parentVal
    : childVal
}
```

上面的代码是合并options中data属性的逻辑。代码先判断是否extend函数还是__init函数的调用（通过是否存在vm参数判断），然后判断data属性是否是函数。返回值也是一个产生data的函数。里面的核心代码就是```if (!to.hasOwnProperty(key)) { to[key] = fromVal; }```。这句代码的作用是将Super的data中存在而Sub的data不存在的属性复制到Sub的data中。并且这个过程是会深复制的。如果遇到相同的key,将会以Sub中的数据为准。
defaultStrat函数的逻辑就很直接了，直接用新的option替换旧的option。

Vue中其它的option合并策略几乎都是不相同的，hooks的合并是旧值和新值拼接成一个新的数组，旧的钩子在前，新的在后。assets和合并策略是，将旧值当作新值的原型链（并不是直接设置新值的原型链，是生成一个新对象）。watch和合并策略是，对每个watch的属性，合并新值和旧值到一个数组，有点类似钩子函数的合并策略。对于methods，props，computed，合并的逻辑都是直接新值替换旧值，由于这几个option的内容没有二级内容，所以直接使用浅拷贝的逻辑进行替换就可以了。


总结：
1. vuejs中的extend作用是生成一个拥有默认options的Vue构造函数。
2. 通过使用extend的继承，可以理解为继承了options。
3. vuejs中的component也是通过Vue.extend来实现的，也就是我们创建的组件和Vue的实例有着一样的创建过程和一样的方法。