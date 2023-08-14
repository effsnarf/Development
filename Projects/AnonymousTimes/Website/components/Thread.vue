<template lang="pug">
    div.thread 
        div.column1
            div.title Canadian 4Chan user sentenced after years of police surveillance
            div.summary
                div.quote
                    p Is this government overreach or is it a good thing, protecting citizens?
                p The 4chan thread has taken a turn towards discussing government surveillance and online censorship. While one user brings up the recent arrest and conviction of a Canadian 4chan user for terrorist activities, others in the thread question the ethics of secretive online surveillance and tracking of certain individuals. The conversation goes on to touch on how content delivery networks (CDNs) compromise user privacy by modifying data in real-time on websites. Users also criticize the US government for their mishandling of the F-35 fighter jet program and their involvement in intelligence activities such as spying on Linux Journal readers and classifying them as extremists.
                div.quote
                    img.left(src="/images/1.jpg")
                    p I'll also just sometimes fuck with them by leaving super obvious dead drops that are nothing but mocking letters detailing their fuckups.
                p The concern towards government surveillance and the implications it can have on online privacy has been a topic of discussion for many years. From concerns about secretive surveillance to issues with large scale data collection, users in the 4chan thread are exposing the ways in which these activities can harm the general public. As the conversation turns towards the CDNs and their compromising of user content, users question how this practice coincides with democracy and freedom of speech. The thread functions as a cautionary warning to all those unaware of how government surveillance can adversely affect their digital lives.
            div.quote
                p normalfags do not care because they're too stupid to understand what's happening
            div.quote
                img.right(src="/images/2.jpg")
                p By doing to you all what you've done to god only knows how many of "WE the PEOPLE" who were innocent or led down the wrong path by your glowfagOp fuckery.
            div.post.quote
                img.left(src="/images/3.png")
                div.text
                    p He had explosives, assault rifles and posted on here about causing damage to Canadian infrastructure. He was tracked on here since 2018, they even followed him by air and road while he drove to the middle of nowhere in the countryside to shoot at signs and stuff
                    p All the info is here, it's nuts how much survelience capabilities Canada has. Just imagine what the US is capable of.
                    p https://edmontonjournal.com/news/local-news/alberta-man-arrested-with-cache-of-automatic-weapons-explosives-sentenced-to-six-years-in-prison
            div.post.quote
                div.text
                    img.left(src="/images/4.jpg")
                    p I assume everything I post or download on the internet is catalogued. CSIS can tongue my anus. The redcoat horsefuckers can come and kill me, I don't care. Long live King Charlie, fuck globohomo.
        div.column2       
            img.main-image(src="/images/thread.png")
            br
            br
            see-also
</template>

<script>
export default {
    name: 'Thread',
    data () {
        return {
            thread: null
        }
    },
}
</script>

<style scoped>
.thread
{
    display: flex;
}

.column1
{
    width: 70%;
    padding-right: 1rem;
}
.column2
{
    width: 30%;
}

.title{
    font-family: 'Playfair Display', serif;
    font-size: 3rem;
    line-height: 1.2em;
}

.summary > p
{
    margin: 0.5em;
    text-align: justify;
}

.post.quote .text
{
    display: block;
}

.post.quote .text p
{
    margin-bottom: 1em;
    font-size: 1.2rem;
}
.quote
{
    margin: 1rem 0;
    padding: 0.5rem;
    background: #606060;
}
.quote .text
{
    display: flex;
}
.quote p
{
    font-size: 2rem;
}
.post.quote .text::before,
.quote:not(.post) p::before {
  content: "\201C"; /* This is the Unicode value for a left double quotation mark */
  font-size: 2em;
  line-height: 0.1em;
  margin-right: 0.25em;
  vertical-align: -0.4em;
}

.post.quote .text::after,
.quote:not(.post) p::after {
  content: "\201D"; /* This is the Unicode value for a right double quotation mark */
  font-size: 2em;
  line-height: 0.1em;
  margin-left: 0.25em;
  vertical-align: -0.4em;
}

.quote img
{
    width: 20%;
    border-radius: 0.5rem;
}

.main-image {
    width: 100%;
}

img.left
{
    float: left;
    margin-right: 1rem;
}

img.right
{
    float: right;
    margin-left: 1rem;
}
</style>