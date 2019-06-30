// import './next-tick'

// import './observer';


import Vue from '../src/instance/index';

const app = new Vue({
  data() {
    return {
      name: 'liu'
    };
  },
  watch: {
    name: (v) => {
      console.log('watch name', v);
    }
  }
})

setTimeout(() => {
  app.name = 'haha'
}, 1000);
