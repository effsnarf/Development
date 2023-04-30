<template lang="pug">
  div(v-if="article")
    h2 {{ article.title }}
    br
    ul
      li(v-for="section in article.sections", v-text="section.title")
    br
    .section(v-for="(section, index) in article.sections", :key="section.title")
      .image
        a(target="_blank", href="article.image.urls[index]")
          img(:src="article.image.urls[index]")
      .content
        h3 {{ section.title }}
        p.text {{ section.text }}
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  props: {
    article: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
    }
  },
  watch: {
    article: function (article) {
      if (!article) {
        return
      }
      article.sections.forEach((section) => {
        section.title = section.title.split(':').pop().trim()
      })
    }
  }
})
</script>

<style scoped>
li
{
  list-style: disc;
  margin-left: 1.5em;
}
.section
{
  display: flex;
  gap: 1em;
  margin-bottom: 2em;
}
.section:nth-child(odd)
{
  flex-direction: row-reverse;
}
.image
{
  width: 30%;
}
.content
{
  width: 70%;
}
.image img
{
  width: 100%;
  border-radius: 1em;
}
h3
{
  opacity: 0.8;
}
.content .text
{
  text-align: justify;
  opacity: 0.6;
}


</style>