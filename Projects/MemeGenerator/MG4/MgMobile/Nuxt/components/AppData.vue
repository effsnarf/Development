<template lang="pug">

</template>

<script>
export default {
  name: "AppData",
  props: {
    urlName: {
      default: null,
    },
  },
  data() {
    return {
      generator: null,
    };
  },
  methods: {
    refresh: function () {
      const urlName = this.urlName;
      this.generator = {
        urlName: urlName,
        displayName: urlName.replace("-", " "),
        imageUrl: "https://i.imgur.com/QwWQw2v.jpeg",
      };
      const pageData = {
        generator: this.generator,
      };
      this.$emit("update:pageData", pageData);
    },
  },
  watch: {
    urlName: {
      handler: function () {
        this.refresh();
      },
      immediate: true,
      deep: false,
    },
  },
};
</script>

<style scoped></style>
