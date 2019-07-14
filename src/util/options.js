import { isPlainObject } from './index';

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