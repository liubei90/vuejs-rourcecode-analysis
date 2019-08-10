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