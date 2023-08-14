<template lang="pug">
    div.teasers
        thread-teaser(v-for="teaser in teasers", :teaser="teaser")
</template>

<script>
export default {
    name: 'ThreadTeasers',
    props: {
        teasers: {
            type: Array,
            default: () => []
        }
    }
}
</script>

<style>
.teasers
{
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
}
.teasers > div
{
    margin-bottom: 1rem;
}
</style>