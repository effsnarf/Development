<template lang="pug">
div("class"="comp-app-search")
  div("class"="search")
    div("class"="icon", "v-text"="'🔎'")
    input("type"="search", "placeholder"="Search", "@input"="$emit('input', $event.target.value)")
</template>

<script>
export default {
  name: "AppSearch",
};
</script>

<style scoped>
.search {
  display: flex;
  gap: 0.5em;
  width: fit-content;
  padding: 0.5em 1em;
  background: white;
  border-radius: 0.7em;
}
.search input {
  border: none;
  width: 100%;
  padding: 0;
  font-size: 110%;
}
.search input:focus {
  outline: none;
}
</style>
