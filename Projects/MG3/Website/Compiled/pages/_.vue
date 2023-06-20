<template>
  <app />
</template>

<script>
export default {
  layout: "base",
  name: "IndexPage",
  async asyncData({$content, params}) {
    const title = "Meme Generator";
    return {
      page: {
        title: title,
        meta: [
          { property: 'og:title', content: title },
        ]
      }
    }
  },
  head()
  {
    return {
      title: this.page.title,
      meta: this.page.meta
    };
  }
};
</script>
