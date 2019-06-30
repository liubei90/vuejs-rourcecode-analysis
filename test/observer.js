import Dep from '../src/observer/dep'
import Watcher from '../src/observer/watcher'


const dep = new Dep();
const watcher1 = new Watcher('warcher1');
const watcher2 = new Watcher('warcher2');

dep.addSub(watcher1);
dep.addSub(watcher2);

dep.notify();