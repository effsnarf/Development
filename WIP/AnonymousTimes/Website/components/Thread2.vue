<template lang="pug">
    div.thread 
        div.column1
            div.title &gt;ends the “why do you lift” debate once and for all
            div.subtitle Loneliness and Depression on 4chan
            div.summary
                div.quote
                    img.left(src="/images/5.png")
                    p The past has already happened and you need to let it go and try to make the present situation as right as you can without thinking about the past or even the future.
                    div.info
                        span.replies (1 reply)
                p Preoccupation with feelings of loneliness and wanting to feel reciprocated or be a part of something is just because you had a frosty or no relationship at all with your family growing up. Sorry it happened to you but dwelling on it is not going to make the present situation any better. The past has already happened and you need to let it go and try to make the present situation as right as you can without thinking about the past or even the future. You're a grown man now. I shouldn't have to tell you that there's no serendipitous plot twist like in the Friends tv show where you move out into a new apartment and suddenly you have a family.
                p Pick a career you can envision yourself working hard at, then focus on getting really good at it, and then build a lifestyle around that occupation. Don't worry about things that have already happened or what will happen, just strive to be as honest and forthright as you can. You can fix this crumbling house and still have time to enjoy living in it if you start working hard now.
                div.quote
                    p.text-right Isolating yourself just corrodes your soul, I don't even want to try to make friends anymore because I'm just a depressed loser and can't find enjoyment in any social activities besides lifting.
                    div.info
                        span.replies (2 replies)
                p Unironically true, I've been observing this in myself.
                p >Have lots of buddies and friends in highschool
                p >Decide to go to local community college instead of uni to save money
                p >commuter school where no one wants to interact outside of class
                p >No friends from classes, not a single one from highschool even checks in on me
                p Isolating yourself just corrodes your soul, I don't even want to try to make friends anymore because I'm just a depressed loser and can't find enjoyment in any social activities besides lifting. Make sure to get your daily dose of friendship or it will turn you into a goblin.

                div.quote
                    p Normies are just as f***** in the head as the average anon but expect you to play their social games.
                    div.info
                        span.replies (1 reply)
                p How many of you interact with normies on a regular basis? They are utter gutter cunts that have 0 self awareness. Yes I know that the average sperg on 4chan is not much better but that is to be expected here. Normies are just as fucked in the head as the average anon but expect you to play their social games. Been there, done that. It is far more enjoyable to learn to enjoy your own company and do your own shit than be on "dat grindset" and sell your soul.
                div.quote
                    p.text-right We have a deep rooted psychological need for social interaction whether you like it or not.
                    div.info
                        span.replies (5 replies)
                p c) not enough social interaction.
                p We have a deep rooted psychological need for social interaction whether you like it or not. For instance, babies that have all of their basic needs taken care of (food, water, shelter) but don't get any social interaction will die. We saw this happen during the Nazis human experiments and the Yugoslav wars of the 90s.
                div.post.quote
                    img.right(src="/images/3.png")
                    div.text
                        p I’m 35, 194cm tall at 110kg bw. Nordic.
                        p Wife that I love and she loves me. We have sex pretty much every single day.
                        p A 2.5 yr old kid that I can’t stop being proud of every day. She goes to the toilet alone.
                        p A good job, house on the country side with no people around, a car, Audi a6 allroad, that I enjoy driving everyday to work and home.
                        p I still want to end it all most days. Yesterday was the first day in 2 months where I felt good.

                p The thread seems to revolve around loneliness, depression and the human need for social interaction. Some users try to offer advice and others talk about their own experiences.
                div.quote
                    img.left(src="/images/6.jpg")
                    p.text-right I don't even mask my quirks, but I look good and it makes people overlook everything, and think of me as a himbo rather than a weirdo.
        div.column2       
            img.main-image(src="/images/7.png")
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
    font-family: 'Noto Serif';
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

.teaser img
{
    aspect-ratio: 4/1;
    object-fit: cover;
}
.teaser .title
{
    font-size: 1.4rem;
}

.title{
    font-family: 'Playfair Display', serif;
    font-size: 3rem;
    line-height: 1.2em;
}

.title2
{
    font-size: 2rem;
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
    font-size: 1.4rem;
}
.post.quote .text > p:first-child::before,
.quote:not(.post) p::before {
  content: "\201C"; /* This is the Unicode value for a left double quotation mark */
  font-size: 2em;
  line-height: 0.1em;
  margin-right: 0.25em;
  vertical-align: -0.4em;
}

.post.quote .text > p:last-child::after,
.quote:not(.post) p::after {
  content: "\201D"; /* This is the Unicode value for a right double quotation mark */
  font-size: 2em;
  line-height: 0.1em;
  margin-left: 0.25em;
  vertical-align: -0.4em;
}

.quote img
{
    width: 30%;
}

.info
{
    text-align: right;
    opacity: 0.6;
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

img
{
    border-radius: 0.5rem;
}
</style>