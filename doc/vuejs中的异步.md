*src/core/util/next-tick.js*

vuejs中的异步函数是nextTick，我们在组件内部也可以通过$nextTick来使用。主要功能是注册一个在下一个事件循环执行的函数。

next-tick.js中有一个callbacks数组，用来存放当前事件循环内被注册的所有异步执行函数。然后启动一个定时器，在下一个事件循环将callbacks中的所有异步事件一次执行完毕。

主要的代码逻辑如下：

```

const callbacks = [];
let pending = false;

function refreshCallbacks() {
  pending = false;
  const copies = callbacks.slice(0);
  callbacks.length = 0;
  for (let i = 0; i < copies.length; i++) {
    copies[i]();
  }
}

function timerFunc() {
  setTimeout(refreshCallbacks, 0);
}

export const nextTick = function(cb) {
  callbacks.push(() => {
    if (cb) {
      cb();
    }
  });

  if (!pending) {
    pending = true;
    timerFunc();
  }
}

```

在vuejs中会对timerFunc函数做渐进处理，优先使用Promise的微任务模式，之后是MutationObserver，setImmediate，最后才是setTimeout。由于微任务是在当前事件循环内执行的，执行的结果会反应到界面的下一帧刷新上。使用setTimeout这会将计算结果延迟到第二帧生效。