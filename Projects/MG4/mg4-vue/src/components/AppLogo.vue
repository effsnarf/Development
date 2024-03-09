<template lang="pug">
a("class"="comp-app-logo flex")
  img("src"="/images/logo.png")
  div("class"="logo0")
    div("v-text"="'Meme'", "class"="logo1")
    div("v-text"="'Generator'", "class"="logo2")
</template>

<script>
export default {
  name: "AppLogo",
};
</script>

<style scoped>
.comp-app-logo {
  padding: 0.5em;
  font-family: impact;
  font-size: 2em;
  line-height: 1.3em;
  text-transform: uppercase;
}
.flex {
  align-items: center;
  gap: 1rem;
}
.logo0 {
  position: relative;
  top: 0.5rem;
}
.logo1 {
  font-size: 200%;
}
a:hover {
  background: transparent !important;
}
</style>
