<template lang="pug">
div
  div(style="max-width: 1024px; margin: auto;")
    div.w-30pc.absolute
      img(src="/_nuxt/img/robot/1.png")
    div.flex
      div.w-25pc
        div(style="height: 10rem;") &nbsp;
        ul.menu1
          li
            img(src="/_nuxt/img/tasks/email.png")
            span Write poetry
          li
            img(src="/_nuxt/img/tasks/email.png")
            span DAN / Jailbreak
          li
            img(src="/_nuxt/img/tasks/email.png")
            span Write an email
          li
            img(src="/_nuxt/img/tasks/bug.png")
            span Debug your code
          li
            img(src="/_nuxt/img/tasks/news.png")
            span News article
          li
            img(src="/_nuxt/img/tasks/microphone.png")
            span Rap battle
          li
            img(src="/_nuxt/img/tasks/microphone.png")
            span Invent fictional disorders
      div
        h1 HackGPT
        h2 The Art of Using ChatGPT
  MainPage
</template>

<script>
  export default {
    data() {
      return {};
    },
    
}
</script>

<style scoped>
div
{
  border: 0px dashed white;
}

h3
{
  background: black;
}

ul.menu1 li
{
  display: flex;
  font-size: 1.3rem;
  text-shadow: -2px 2px 2px #000;
  background: black;
  cursor: pointer;
}

ul.menu1 li:hover
{
  background: #00000080;
}

ul.menu1 li img
{
  width: 2em;
  height: 1.5em;
  margin-right: 0.5em;
  object-fit: contain;
}
</style>