import Dep from './dep';


export class Observer {
  value;

  constructor(value) {
    if (Array.isArray(value)) {
      console.log('暂不支持数组');
    } else {
      this.walk(value);
    }
  }

  walk(obj) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i]);
    }
  }
}

export function observe(value, asRootData) {
  let ob = new Observer(value);
  return ob;
}

export function defineReactive(obj, key) {
  const property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return;
  }

  let val = obj[key];
  const dep = new Dep();
  const getter = property.get;
  const setter = property.set;
  // let childOb = observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function() {
      const value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
        // if (childOb) {
        //   childOb.dep.depend();
        // }
      }
      return value;
    },
    set: function(newVal) {
      const value = getter ? getter.call(obj) : val;
      if (value === newVal || (newVal !== newVal && value !== value)) {
        return;
      }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      dep.notify();
    }
  })

}