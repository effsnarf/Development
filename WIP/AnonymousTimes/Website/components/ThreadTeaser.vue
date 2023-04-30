<template lang="pug">
  div.teaser
    .image
        img(:src="`https://i.4cdn.org/${teaser.forum.id}/${teaser.image?.filename}`")
    .text
        .entity {{ teaser.entity }}
        .title
            span {{ teaser.title }}
            span.ml-l1.opacity-50 {{ teaser.posts.count }} posts
        .subtitle(v-if="(teaser.subtitle!=teaser.title)") {{ teaser.subtitle }}
        .summary(v-if="paragraphs")
            p {{ paragraphs[0] }}
            .quote(v-if="quotes[0]") {{ quotes[0] }}
            p {{ paragraphs[1] }}
            .quote(v-if="quotes[1]") {{ quotes[1] }}
            .quote(v-for="quote in quotes.slice(2, 500)") {{ quote }}
        .info
            .link
                a(target="_blank" :href="`https://boards.4channel.org/${teaser.forum.id}/thread/${teaser.id}`")
                    span {{ teaser.posts.count }} posts in a 4chan thread 🔗
</template>

<script>
export default {
    name: 'ThreadTeaser',
    props: {
        teaser: {
            type: Object,
            default: () => {}
        }
    },
    computed: {
        paragraphs() {
            return this.teaser
                ?.summary
                ?.split('\n')
                .map(p => p.trim())
                .filter(p => p);
        },
        quotes() {
            return this.teaser.quotes
                ?.filter(s => (s.length < 160))
                || [];
        }
    }
}
</script>

<style>
.teaser
{
    display: flex;
    flex-direction: row;
    gap: 1em;
}
.teaser .title, .teaser .subtitle
{
    white-space: pre-line;
}
.teaser .title
{
    font-size: 1.6rem;
}
.teaser .subtitle
{
    font-size: 1.3rem;
    text-align: right;
}
.teaser .image
{
    width: 30%;
}
.teaser .text
{
    width: 70%;
}
.teaser .summary
{
    display: flex;
    flex-direction: column;
    text-align: justify;
    white-space: pre-line;
    overflow: hidden;
    gap: 1em;
}
.teaser .summary p
{
    opacity: 0.75;
}

.quote
{
    background: #ffffff80;
    border-radius: 0.5em;
    padding: 0.5em;
    font-size: 1.2rem;
}

.quote::before {
  content: "\201C"; /* This is the Unicode value for a left double quotation mark */
  font-size: 2em;
  line-height: 0.1em;
  margin-right: 0.25em;
  vertical-align: -0.4em;
}

.quote::after {
  content: "\201D"; /* This is the Unicode value for a right double quotation mark */
  font-size: 2em;
  line-height: 0.1em;
  margin-left: 0.25em;
  vertical-align: -0.4em;
}


img
{
    object-fit: cover;
}

.info
{
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    opacity: 0.5;
    text-align: right;
    gap: 4em;
}

a
{
    color: #fff;
}
a:hover
{
    text-decoration: underline;
}
</style>