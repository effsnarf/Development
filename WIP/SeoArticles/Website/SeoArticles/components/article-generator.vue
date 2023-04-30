<template lang="pug">
div

  table.w-100pc(:class="{ 'disabled': isLoading }")
    tr
      td Topic
      td
        input(type="text", v-model="form.topic", placeholder="Article topic")
    tr
      td Brand
      td
        input(type="text", v-model="form.brand", placeholder="Brand name")
    tr
      td Brand Description
      td
        textarea(type="text", v-model="form.brandDesc", placeholder="Brand description")
    // tr
      td Brand Image
      td
        input(type="text" v-model="form.brandImage", placeholder="Brand image URL")
    // tr
      td Brand Website
      td
        input(type="text" v-model="form.brandWebsite", placeholder="Brand website URL")
    tr
      td Sections
      td
        select(v-model="form.sectionsCount")
          option(v-for="i in 10", :value="i", v-text="i")
      // td.text-center
        // input.section(v-for="(section, index) in form.sections", type="number" v-model="form.sections[index]", placeholder="words")
    tr
      td Tone
      td
        select(v-model="form.tone")
          option(v-for="option in toneOptions" :value="option" v-text="option")
  div
    br
    div.text-center
      div(v-if="isLoading")
        loading-counter(text="Generating article", :total="30 * 1000", :is-loading="isLoading")
        // img(src="/img/loading.gif")
      button(v-if="!isLoading", type="button" @click="generateArticle") Generate Article

  div.error(v-if="error", v-text="error")

</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'IndexPage',
  data () {
    // return {
    // }
    return {
      isLoading: false,
      seoArticles: null,
      article: null,

      form: {
        topic: null,
        brand: null,
        brandDesc: null,
        // brandImage: 'https://www.californiacontractorbonds.com/wp-content/uploads/2022/04/Screen-Shot-2022-04-21-at-3.28.45-PM.png',
        brandWebsite: null,
        tone: 'Professional',
        sectionsCount: 3
      },

      toneOptions: ['Professional', 'Informative', 'Sarcastic'],

      error: null
    }
  },
  computed: {
  },
  watch: {
  },
  mounted () {
  },
  methods: {
    async generateArticle () {
      try {
        this.error = null
        this.isLoading = true
        const form = this.form
        // const sections = form.sections.filter(s => s)
        // const sections = new Array(form.sectionsCount).fill(500)
        const sections = form.sectionsCount
        const seoArticles = await this.getSeoArticles()
        this.article = await seoArticles.generateArticle(form.topic, form.brand, form.brandDesc, form.brandImage, form.brandWebsite, sections, form.tone)
        this.$emit('article', this.article)
      } catch (ex) {
        this.error = ex.toString()
      } finally {
        this.isLoading = false
      }
    },
    async getSeoArticles () {
      if (!this.seoArticles) {
        const api = await ApifyClient.createClasses()
        this.seoArticles = await api.SeoArticles.new()
      }
      return this.seoArticles
    },
    setExample (example) {
      Object.assign(this.form, example)
      this.error = null
      this.scrollToTop()
    },
    scrollToTop () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }
})
</script>


<style scoped>
*
{
    font-size: 1.2rem;
}

table tr td
{
    padding: 0.2em 0;
}

table tr td:first-child
{
    width: 10em;
}

textarea
{
    height: 6em;
}

input.section
{
    display: inline-block;
    width: 5em;
    text-align: center;
}

.error
{
    margin: 1em 0;
    padding: 0.5em 1em;
    background: red;
    color: white;
    border-radius: 0.5em;
}
</style>