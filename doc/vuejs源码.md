*该文章基于vuejs2.6.10版本*

vuejs的源码在大的功能模块上分为compiler,runtime,server。本文主要涉及到runtime和compiler。服务端渲染暂时不做研究。

本文章会先深入runtime各个子模块，中间穿插一些compiler的知识。之后再深入研究compiler的各个子模块。同时会参照源码实现一个简易版的vuejs，剔除掉所有兼容weex的代码，所有development环境下的调试信息,所有服务端渲染的代码。尽量还原vuejs的最本质的实现方式。源码中用到的知识点我会尽量详细描述出来，有些复杂的知识点会单独写一些文章来阐述。

vuejs的compiler模块提供了编译vue模板的功能，这里的模板是options中的template,.vue文件中的template标签。模块的输出是一个render函数和一个staticRenderFns函数。

vuejs的runtime模块提供了vuejs的最基础的能力，即mvvm,vdom。将一个vue实例转换为真实dom元素并挂载到页面上。

1. vuejs中的异步
2. vuejs如何实现数据监听（脏值检测）
3. vuejs实例化的流程
4. vuejs的extend及继承
5. vuejs中vdom与真实dom的关系
6. vuejs中vdom的流程
7. vuejs中vdom的优化算法（如何复用已有元素）
8. vuejs中的动画
9. vuejs如何编译模板