<template lang="pug">
div("class"="comp-generator")
  AppBox
    template("v-slot:content")
      img("class"="generator-image", ":src"="getImageUrl(generator?.imageID)")
      h1("v-text"="generator?.displayName")
      div("class"="poem")
        div("v-for"="stanza in poem", "v-text"="stanza", "class"="stanza")
      div(":class"="{expanded: isArticleExpanded}", "v-text"="getArticleText(generator?.desc?.article)", "class"="article")
      div("class"="justify-center flex")
        button("class"="expand", "v-text"="isArticleExpanded ? '🡅' : '🡇'", "@click"="isArticleExpanded = !isArticleExpanded")
  AppGallery(":template"="'app.instance.medium'", ":items"="instances1")
</template>

<script>
export default {
  name: "Generator",
  props: {
    urlName: {
      default: null,
    },
  },
  data() {
    return {
      generator: null,
      instances1: null,
      isArticleExpanded: false,
    };
  },
  mounted: async function () {
    await this.init();
  },
  methods: {
    init: async function () {
      const urlName = this.urlName;
      const url1 = `https://db.memegenerator.net/MemeGenerator/api/Generators/select/one?urlName="${urlName}"`;
      this.generator = await (await fetch(url1)).json();
      const url2 = `https://db.memegenerator.net/MemeGenerator/api/Instances/select/popular?languageCode=%22en%22&pageIndex=0&urlName=%22${urlName}%22`;
      this.instances1 = (await (await fetch(url2)).json()).slice(0, 9);
    },
    getPoem: function () {
      const poems = this.generator?.desc?.poem;
      if (!poems) return [];
      const index = Math.floor(Math.random() * poems.length);
      return poems[index];
    },
    getImageUrl: function (imageID) {
      if (!imageID) return null;
      return `https://img.memegenerator.net/images/${imageID}.jpg`;
    },
    getArticleText: function (text) {
      if (!text) return null;
      if (text.startsWith("Title: ")) {
        text = text.slice(text.indexOf("\n") + 1);
      }
      return text;
    },
  },
  computed: {
    poem: function () {
      return this.getPoem();
    },
  },
};
</script>

<style scoped>
.flex1 {
  display: flex;
  flex-direction: row;
  gap: 1em;
}
.generator-image {
  width: 20%;
  margin: 0.5em 1em 0.5em 0;
  float: left;
  border-radius: 0.5em;
  box-shadow: -3px 3px 10px black;
}
.article {
  margin: 2em 1em;
  max-height: 4.5em;
  overflow: hidden;
  transition: 1s;
}
.article.expanded {
  max-height: 30em;
}
.poem {
  display: flex;
  flex-direction: column;
  margin: auto;
  width: fit-content;
  padding: 1em;
  font-size: 130%;
  color: white;
  background: #00000060;
  border-radius: 0.5em;
  box-shadow: inset -3px 3px 10px black;
  text-shadow: -2px 2px 1px black;
}
h1 {
  font-size: 3em;
}
button.expand {
  font-size: 120%;
  opacity: 0.4;
}
button.expand:hover {
  opacity: 1;
}
</style>
