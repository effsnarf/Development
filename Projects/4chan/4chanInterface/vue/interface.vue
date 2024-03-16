<template>
  <div class="fourchan-interface">
    <h1>4chan Interface</h1>
    <div>
      <h2>Thread Summary</h2>
      <p></p>
      <div v-text="thread"></div>
      <button @click="summarizeThread">Summarize thread</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      thread: null,
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    async init() {
      const url = `https://a.4cdn.org/${this.board}/thread/${this.threadID}.json`;
      this.thread = await (await fetch(url)).json();
    },
    summarizeThread() {
      alert("Summarizing thread");
    },
  },
  computed: {
    board() {
      return this.urlParts[3];
    },
    threadID() {
      return parseInt(this.urlParts[5]);
    },
    urlParts() {
      return window.location.href.split("/");
    },
  },
};
</script>
