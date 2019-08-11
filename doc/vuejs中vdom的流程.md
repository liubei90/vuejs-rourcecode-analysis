当一个vuejs引用启动时，会执行根组件的$mount()函数挂载组件，，这个$mount函数中执行了_render函数用来生成根组件的vnode,之后执行_update函数用来生成根组件的真实dom元素和子组件实例和子组件的真实dom元素。_update函数的代码如下。

```
Vue.prototype._update = function(vnode, hydrating) {
  const vm = this;
  const prevEl = vm.$el;
  const prevVnode = vm._vnode;
  vm._vnode = vnode;
  if (!prevVnode) {
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, true);
  } else {
    vm.$el = vm.__patch__(prevVnode, vnode);
  }
}
```

可以看到，_update函数主要是执行了__patch__函数。该函数的定义如下。

```
// src/platforms/web/runtime/patch.js

export const patch = createPatchFunction({ nodeOps, modules });

// src/platforms/web/runtime/index.js

Vue.prototype.__patch__ = inBrowser ? patch : noop;

// src/core/vdom/patch.js
export function createPatchFunction(backend) {
  const { modules, nodeOps } = backend;

  return function patch(oldVnode, vnode, hydrating, removeOnly) {
    if (isUndef(vnode)) {
      if (isDef(oldVnode)) invokeDestroyHook(oldVnode); 
      return;
    }

    let isInitialPatch = false;
    const insertedVnodeQueue = [];

    if (isUndef(oldVnode)) {
      isInitialPatch = true;
      createElm(vnode, insertedVnodeQueue);
    } else {
      const isRealElement = isDef(oldVnode.nodeType);
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly);
      } else {
        if (isRealElement) {
          oldVnode = emptyNodeAt(oldVnode);
        }

        const oldElm = oldVnode.elm;
        const parentElm = nodeOps.parentNode(oldElm);

        createElm(
          vnode, 
          insertedVnodeQueue, 
          parentElm, 
          nodeOps.nextSibling(oldElm));
        
        if (isDef(parentElm)) {
          removeVnodes([oldVnode], 0, 0);
        } else if (isDef(oldVnode.tag)) {
          invokeDestroyHook(oldVnode)
        }
      }
    }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
    return vnode.elm;
  }
}

```

patch函数主要判断是否是初始化时创建还是更新时创建。如果oldVnode是一个VNode对象的实例，并且oldVnode和vnode是相同的(sameVnode(oldVnode, vnode))。此时走优化流程，使用旧的vnode实例替换新的vnode,并且更新旧的elm。这个优化的流程比较复杂，需要对比新旧vnode的差异。 如果是初始化创建，此时的oldVnode可能是undefined或者是挂载点的dom元素。直接执行createElm函数。createElm函数的代码如下。

```
function createElm(
  vnode,
  insertedVnodeQueue,
  parentElm,
  refElm,
  nested,
  ownerArray,
  index
) {
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
    return;
  }

  const data = vnode.data;
  const children = vnode.children;
  const tag = vnode.tag;

  if (isDef(tag)) {
    vnode.elm = nodeOps.createElement(tag, vnode);

    createChildren(vnode, children, insertedVnodeQueue)
    if (isDef(data)) {
      invokeCreateHooks(vnode, insertedVnodeQueue);
    }
    insert(parentElm, vnode.elm, refElm);
  } else if (isTrue(vnode.isComment)) {
    vnode.elm = nodeOps.createComment(vnode.text);
    insert(parentElm, vnode.elm, refElm);
  } else {
    vnode.elm = nodeOps.createTextNode(vnode.text);
    insert(parentElm, vnode.elm, refElm);
  }
}

function createComponent(vnode, insertedVnodeQueue, parentElm, refElm) {
  let i = vnode.data;
  if (isDef(i)) {
    if (isDef(i = i.hooks) && isDef(i = i.init)) {
      i(vnode, false)
    }

    if (isDef(vnode.componentInstance)) {
      initComponent(vnode, insertedVnodeQueue);
      insert(parentElm, vnode.elm, refElm);
      return true;
    }
  }
}

function createChildren(vnode, children, insertedVnodeQueue) {
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i);
    }
  } else if (isPrimitive(vnode.text)) {
    nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)));
  }
}
```

createElm函数的执行会分两个流程，一个是创建自定义组件，一个是创建原生元素。

创建原生元素的流程是，先创建当前vnode对用的真实dom元素，然后创建当前vnode的children。之后将vnode对应的dom元素插入到parentElm中。children的创建过程也是调用了createElm函数。

自定义组件的创建会有些麻烦，在调用createComponent函数之前，自定义组件只有vnode。在createComponent函数中会执行自定义组件的init钩子函数，该函数的代码如下。
```
const componentVNodeHooks = {
  init (vnode, hydrating) {
    const child = vnode.componentInstance = createComponentInstanceForVnode(vnode);
    child.$mount(hydrating ? vnode.elm : undefined, hydrating);
  }
}

export function createComponentInstanceForVnode(vnode, parent) {
  const options = {
    _isComponent: true,
    _parentVnode: vnode,
    parent,
  }

  return new vnode.componentOptions.Ctor(options);
}
```

init函数会生成当前vnode的componentInstance对象，也就是vnode对应的自定义组件的组件实例。之后执行该组件实例的$mount()函数。这一步和根组件的$mount()函数效果一样，会先后执行组件的_render()函数和_update()函数。这样子组件内部的vnode节点会被创建，然后子组件的真实dom也会被创建出来。

至此，整个vdom的构建流程就很清楚了，当根组件的patch函数执行结束，所有组件的组件实例都会被创建，所有组件的真实dom也都会被创建成功并挂载到相应的父组件之上。

当程序在运行时修改了某些响应式对象的值，将会触发组件的updateComponent函数的执行，将会从新执行组件的_render函数和_update函数。这就是vuejs运行时生成和更新dom的流程。