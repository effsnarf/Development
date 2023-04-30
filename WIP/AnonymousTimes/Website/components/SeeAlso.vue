<template lang="pug">
div
    .title See also
    .teaser(v-for="thread in threads")
        img(:src="thread.image")
        .title {{ thread.title }}
        .info
            span.replies {{ thread.replies }} posts

</template>

<script>
export default {
    name: 'SeeAlso',
    data () {
        return {
            threads: []
        }
    },
    mounted() {
        this.threads = [
            {
                title: "And here's my son's room. He's really into fitness",
                summary: "For fat fuckers who are working towards a better physique through meaningful hard-work, strategy, and dedication. This is not QTDDTOT, stick to questions on fat loss. Post height and weight when asking for advice.",
                image: "/images/8.jpg",
                replies: 17
            },
            {
                title: "/fat/ - fat loss general",
                summary: "For fat fuckers who are working towards a better physique through meaningful hard-work, strategy, and dedication. This is not QTDDTOT, stick to questions on fat loss. Post height and weight when asking for advice.",
                image: "/images/9.jpg",
                replies: 56
            },
            {
                title: "I work at a PT clinic, ama about exercise and rehabilitation",
                summary: "For fat fuckers who are working towards a better physique through meaningful hard-work, strategy, and dedication. This is not QTDDTOT, stick to questions on fat loss. Post height and weight when asking for advice.",
                image: "/images/13.jpg",
                replies: 32
            }
        ];
        this.threads = [...this.threads, ...this.threads, ...this.threads, ...this.threads];
    }
}
</script>

<style scoped>
.title
{
    font-size: 2rem;
}
.teaser
{
    margin-bottom: 2em;
}
.teaser img
{
    aspect-ratio: 4/1;
    object-fit: cover;
}
.teaser .title
{
    font-size: 1.4rem;
    line-height: 1.2em;
}

</style>