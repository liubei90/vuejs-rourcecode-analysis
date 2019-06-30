let uid = 0;

export default class Dep {
  static target;
  id;
  subs;

  constructor() {
    this.id = uid++;
    this.subs = [];
  }

  addSub(sub) {
    this.subs.push(sub);
  }

  removeSub(sub) {
    const subs = this.subs;
    if (subs.length) {
      const index = subs.indexOf(sub);
      if (index > -1) {
        subs.splice(index, 1);
      }
    }
  }

  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }

  notify() {
    const subs = this.subs.slice();
    for (let i = 0; i < subs.length; i++) {
      subs[i].update();
    }
  }
}

Dep.target = null;
const targetStack = [];
export function pushTarget(target) {
  targetStack.push(target);
  Dep.target = target;
}

export function popTarget() {
  targetStack.pop();
  Dep.target = targetStack[targetStack.length - 1];
}