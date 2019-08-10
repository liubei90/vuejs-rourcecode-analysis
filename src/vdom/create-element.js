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