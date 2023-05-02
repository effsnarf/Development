<template lang="pug">
  div.page
    div.header
      div.logo Anonymous Times
    div.content
      thread-teasers(:teasers="teasers")
      thread
</template>

<script>
export default {
   data () {
    return {
      thread: null,
      teasers: null
    }
  },
  async mounted() {
    const api = await Apify.Client.createClasses(`http://localhost:3009/api`);
    const db = (await api.Database.new());

    let teasers = await db.getThreadTeasers();
    this.teasers = teasers;
  }
}
</script>

<style scoped>

.page
{
  margin: 0 auto;
  max-width: 60em;
}
.page .header
{

}

.page .content
{
  padding: 1em;
  background: black;
  border: 1px solid white;
}
.logo
{
    font-family: 'Chomsky';
    font-size: 3em;
    color: white;
    text-shadow: -2px 2px 2px #000, 2px -2px 2px #000;
    user-select: none;
}

</style>

<style>
.thread
{
  display: flex;
}

.info
{
    text-align: right;
    opacity: 0.6;
}

img
{
    border-radius: 0.5rem;
    border: 1px solid black;
    box-shadow: -4px 4px 4px #00000080;
}

</style>