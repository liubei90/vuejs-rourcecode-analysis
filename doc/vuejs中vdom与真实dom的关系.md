浏览器的DOM对象中，有个Node对象，是所有html元素的基类。在vuejs内部有个叫VNode的构造对象，所有vuejs应用的元素都是使用VNode对象来表示。VNode对象的结构如下

```
export default function VNode(
  tag, 
  data, 
  children, 
  text, 
  elm, 
  context, 
  componentOptions, 
  asyncFactory) {
  this.tag = tag;
  this.data = data;
  this.children = children;
  this.text = text;
  this.elm = elm;
  this.ns = null;
  this.context = context;
  this.key = null;
  this.componentOptions = componentOptions;
  this.componentInstance = null;
  this.parent = null;
  this.raw = false;
  this.isStatic = fasle;
  this.isRootInsert = true;
  this.isComment = false;
  this.isCloned = false;
  this.isOnce = false;
  this.asyncFactory = asyncFactory;
  this.asyncMeta = null;
  this.isAsyncPlaceholder = false;
  this.ssrContext = null;
  this.fnContext = null;
  this.fnOptions = null;
  this.fnScopeId = null;
}
```
通过构造函数可以看到，这个VNode的实例保存了生成真实Node的tag名称，或者是自定义组件的构造参数componentOptions和组件实例componentInstance。

render函数的第一个参数是vm.$createElement函数，该函数的作用就是生成VNode。render函数要求必须返回一个createElement函数执行后的结果，也就是一个VNode对象实例。

一个简单的render写法如下

```
{
  render(createElement) {
    return createElement('div', { class: 'some-class' }, ['这是一些子元素'])
  }
}

// 或者是一个自定义组件

{
  render(createElement) {
    return createElement('component1');
  }
}
```

vuejs应用执行时，会传递el对象或者手动执行vm.$mount()函数来挂载根组件到body上。这个$mount()做了如下操作。

```
export function mountComponent(vm, el, hydrating) {
  vm.$el = el;
  callHook(vm, 'beforeMount');

  const updateComponent = () => {
    vm._update(vm._render(), hydrating);
  }

  // 该对象生成时会执行一次updateComponent
  new Watcher(vm, updateComponent, () => {}, {
    before() {
      callHook(vm, 'beforeUpdate');
    }
  });

  callHook(vm, 'mounted');
  return vm;
}
```
在$mount()函数执行时，会执行updateComponent()函数，该函数会先执行_render函数，然后再执行_update函数。

_render函数内部就调用了根组件的render函数，这样根组件内部的元素对应的VNode实例就会被生成，包括所有原生元素和自定义组件。此时自定义组件的render函数并没有执行，具体的执行时机是在_update函数中执行了_patch函数。_patch函数的作用就留到下节再讲。

现在就差最后一步，createElement函数是如何生成对应的VNode实例。下面是createElement的实现代码

```

import VNode from "./vnode";
import { createComponent } from './create-component';

export function createElement(
  context,
  tag,
  data,
  children,
  normalizationType,
  alwaysNormalize
) {
  return _createElement(context, tag, data, children, normalizationType);
}

export function _createElement(
  context,
  tag,
  data,
  children,
  normalizationType
) {
  if (!tag) {
    return createEmptyVNode();
  }

  let vnode;

  if (typeof tag === 'string') {
    let Ctor;
    if (config.isReservedTag(tag)) {
      vnode = new VNode(tag, data, children, undefined, undefined, context);
    } else if (isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      vnode = createComponent(Ctor, data, context, children, tag);
    } else {
      vnode = new VNode(tag, data, children, undefined, undefined, context);
    }
  } else {
    vnode = createComponent(tag, data, context, childrem);
  }

  return vnode;
}



export function createComponent(
  Ctor,
  data,
  context,
  children,
  tag
) {
  if (isUndef(Ctor)) {
    return
  }

  data = data || {};
  
  // 此处和自定义组件的render和_patch的执行相关
  installComponentHooks(data);

  const vnode = new VNode(
    `vue-component-${Ctor.cid}${Ctor.options.name}`,
    data, undefined, undefined, undefined, context,
    { Ctor, propsData, listeners, tag, children }
  )

  return vnode;
}
```

上面的代码可以看到，createElement的执行过程就是，判断tag是否html原生的标签还是自定义组件，然后分别生成原生标签对应的VNode实例和自定义组件对应的VNode实例。

此时只有根组件内部的VNode实例被创建，对应的真实dom还没有被创建，自定义组件的VNode实例和对应的真实dom也都没有被创建。

结论：
1. vuejs中的虚拟dom是通过VNode对象实现
2. 真实dom的创建过程是和VNode的创建过程分离的，真实dom是在update函数执行时被创建
3. 子组件的render函数的执行和对应的VNode对象的实例化过程也是在update函数执行时被创建。
4. vuejs的整个VNode层级的构建是自顶向下的。先构建根组件，然后构建子组件。