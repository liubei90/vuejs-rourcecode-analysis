import { nextTick } from '../src/util/next-tick';

console.log(1);

nextTick(() => {
  console.log(2);
  setTimeout(() => {
    console.log(6);
  });
});

console.log(3);

nextTick(() => {
  nextTick(() => {
    console.log(4);
  });
  console.log(5);
});

// 1 3 2 5 6 4