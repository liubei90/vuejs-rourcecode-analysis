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