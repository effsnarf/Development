<template lang="pug">
span(v-html="formatValue(Number(animatedValue))")
</template>
  <script>
  import anime from '~/lib/animejs/anime.es.js';
  
  export default {
    props: {
      value: {
        type: [Number, String],
        default: '0',
        required: true,
      },
      formatValue: {
        type: Function,
        default: value => parseInt(value),
      },
      easing: {
        type: String,
        default: 'linear',
      },
      duration: {
        type: Number,
        default: 400,
      },
      update: Function,
      begin: Function,
      complete: Function,
      run: Function,
      delay: {
        type: Number,
        default: 0,
      },
      round: {
        default: null,
      },
    },
    data() {
      return {
        animatedValue: 0,
      };
    },
    mounted() {
      this.animateValue(this.value);
    },
    watch: {
      value(value) {
        this.animateValue(value);
      },
    },
    methods: {
      animateValue(value) {
        const {
          begin,
          easing,
          duration,
          complete,
          update,
          run,
          delay,
          round,
        } = this;
        anime({
          targets: this,
          animatedValue: value,
          duration,
          easing,
          update,
          begin,
          complete,
          run,
          delay,
          round,
        });
      },
    },
  };
  </script>
  