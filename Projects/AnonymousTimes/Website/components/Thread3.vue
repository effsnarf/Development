<template lang="pug">
    div.thread 
        div.column1
            div.title /fat/ - fat loss general
            div.subtitle No fatting edition
            div.summary
                div.quote
                    img.right(src="/images/10.png")
                    p Cravings are normal and usually indicate a micronutrient deficiency. Look at this image and diversify your diet accordingly.
                    div.info
                        span.replies (1 reply)
                p For fat fuckers who are working towards a better physique through meaningful hard-work, strategy, and dedication. This is not QTDDTOT, stick to questions on fat loss. Post height and weight when asking for advice.
                p Plan your weight loss: https://www.losertown.org/eats/cal.php
                p Track your nutrition with MyFitnessPal (better for packaged food), Cronometer (better for generic food/macros) or LoseIt (great for both).

                div.quote
                    p.text-right Why do people do this shit? This is just self harm, you cant measure fat loss accurately on a day to day basis. In fact by doing that you just lowered your BMR by putting your body in starvation mode.
                    div.info
                        span.replies (2 replies)
                p >Have lots of buddies and friends in highschool

                div.quote
                    img.left(src="/images/11.jpg")
                    p WHY CAN'T I SQUAT PROPERLY FATBROS??? EVERYTIME I GET LOW I FEEL UNSTABLE AND CANT HOLD FORM
                    div.info
                        span.replies (1 reply)
                p Dont squat when youre obese do leg press. Its the same reason you cant do pullups youre not strong enough to squat your bodyweight. Seriously stop doing that immediately you will get injured, speaking from personal experience my knee is permanently fucked up from squatting with bad form while obese. Work up to your bodyweight on leg press first or just lose the weight.
                div.quote
                    p.text-right We have a deep rooted psychological need for social interaction whether you like it or not.
                    div.info
                        span.replies (5 replies)
                div.greentext
                    img.right(src="/images/12.jpg")
                    div.text
                        p >be me
                        p >pizza on sale for 5 toppings at domino's for $10 carryout
                        p >large or medium pan
                        p >last day of sale tomorrow fatties
                        p >order medium pan
                        p >extra cheese, onions, mushroom, roasted red peppers, sausage
                        p >Dominos tells me on the order screen 2720 calories
                        p >I'm on 1500 a day
                        p >eating half right now, already put the other half in the fridge for tomorrow
                        p >will be at 1360 calories
                        p >will make a small salad later to cover the difference
                        p >losing weight on pizza
                        p >my pizzas face
                p div.post.quote
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
            img.main-image(src="/images/9.jpg")
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


.greentext
{
    background: linear-gradient(to bottom, #00ff00a8, #00ff0060);
    padding: 1rem;
    text-shadow: -8px 8px 2px black;
}

.greentext img
{
    width: 30%;
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
    background: linear-gradient(to bottom, #ffffff80, #000000);
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

.main-image {
    aspect-ratio: 2 / 4;
    width: 100%;
    object-fit: cover;
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