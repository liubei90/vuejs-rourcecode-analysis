import VNode from "./vnode";

const componentVNodeHooks = {
  init (vnode, hydrating) {
    const child = vnode.componentInstance = createComponentInstanceForVnode(vnode);
    child.$mount(hydrating ? vnode.elm : undefined, hydrating);
  }
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

export function createComponentInstanceForVnode(vnode, parent) {
  const options = {
    _isComponent: true,
    _parentVnode: vnode,
    parent,
  }

  return new vnode.componentOptions.Ctor(options);
}