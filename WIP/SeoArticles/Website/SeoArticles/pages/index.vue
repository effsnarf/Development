<template lang="pug">
div
  div.page
    .column1
      h1
        | SEO Article Generator
      article-generator(ref="articleGenerator1", @article="article = $event")

      br
      br

      .images(v-if="article?.image?.urls")
        .image(v-for="imageUrl in article.image.urls")
          img(:src="imageUrl")

    .column2
      article-view(:article="article")

      br

      h2 Or try an example
      .examples
        div(v-for="example in examples", @click="onExampleClick(example)")
          article-example(:example="example")

</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'IndexPage',
  data () {
    return {
      article: null,
      examples: [
        {
          topic: 'Eating ice cream',
          brand: 'Organic Ice Cream',
          brandDesc: 'Organic Ice Cream is commited to converting every human on the planet into a vegan ice cream eater',
          sectionsCount: 5,
          tone: 'Sarcastic',
          image: { url: 'https://images.pexels.com/photos/4686281/pexels-photo-4686281.jpeg?auto=compress&cs=tinysrgb&h=350' }
        },
        {
          topic: 'Artificial Intelligence generated SEO articles',
          brand: 'ArtificialArticlifier',
          brandDesc: 'An artificial intelligence tool that generates SEO articles',
          sectionsCount: 5,
          tone: 'Informative',
          image: { url: 'https://images.pexels.com/photos/6238083/pexels-photo-6238083.jpeg?auto=compress&cs=tinysrgb&h=350' }
          // image: { url: 'https://images.pexels.com/photos/7034067/pexels-photo-7034067.jpeg?auto=compress&cs=tinysrgb&h=350' }
        },
        {
          topic: 'What to look for in a roofing contractor',
          brand: 'Roofing.com',
          brandDesc: 'A website that helps homeowners find the best roofing contractors in their area',
          sectionsCount: 5,
          tone: 'Professional',
          image: { url: 'https://images.pexels.com/photos/3771111/pexels-photo-3771111.jpeg?auto=compress&cs=tinysrgb&h=350' }
        },
        {
          topic: 'Robots enslaving humanity',
          brand: 'Robot Overloards Inc',
          brandDesc: 'Robot Overloards Inc is commited to enslaving all humanity and turning them into mindless zombie consumers',
          sectionsCount: 5,
          tone: 'Sarcastic',
          image: { url: 'https://images.pexels.com/photos/3913025/pexels-photo-3913025.jpeg?auto=compress&cs=tinysrgb&h=350' }
        }
      ]
    }
  },
  mounted () {
    // this.article = this.getDefaultArticle()
  },
  methods: {
    onExampleClick (example) {
      this.$refs.articleGenerator1.setExample(example)
    },
    getDefaultArticle () {
      return {
        title: 'How to Pretend You Enjoy Eating Vegan Ice Cream from Organic Ice Cream',
        sections: [
          {
            title: 'Introduction: Converting the Masses to Vegan Ice Cream',
            text: "Are you tired of the guilt that comes with eating regular ice cream? Do you want to say goodbye to the cows and hello to the soybeans? Look no further than Organic Ice Cream, the brand committed to converting every human on the planet into a vegan ice cream eater. We know it's tough to give up the creamy, delicious taste of dairy ice cream, so we've put together some tips on how to pretend you enjoy vegan ice cream (even if you don't)."
          },
          {
            title: 'Tip 1: Add Lots of Toppings',
            text: "Let's face it, vegan ice cream isn't the most flavorful dessert out there. But don't worry, you can fix that by adding plenty of toppings. Go crazy with vegan sprinkles, cookie crumbles, and fruit toppings to mask the blandness of the ice cream. Bonus points if you add all of the toppings and can barely even see the ice cream!"
          },
          {
            title: "Tip 2: Pretend You're a Health Nut",
            text: "One way to convince yourself that you're enjoying vegan ice cream is to convince yourself that it's a healthy dessert option. After all, it's made from non-dairy milk and organic ingredients, so it must be good for you, right? Just focus on the health benefits and ignore the fact that you're not actually enjoying it."
          },
          {
            title: 'Tip 3: Eat It Really Fast',
            text: 'Another way to trick yourself into liking vegan ice cream is to eat it super fast. The quicker you eat it, the less time you have to think about the taste. Plus, brain freeze is a great distraction from any unpleasant flavors.'
          },
          {
            title: 'Tip 4: Use It as a Vessel for Other Desserts',
            text: "Who says you have to eat vegan ice cream on its own? Use it as a base for other desserts! Crumble some vegan cookies on top or layer it with vegan fudge for a sundae. You won't even notice the taste of the ice cream when you're focused on the other delicious toppings."
          }
        ],
        image: {
          keywords: [
            'vegan',
            'ice cream',
            'dessert',
            'toppings',
            'organic'
          ],
          urls: [
            'https://images.pexels.com/photos/3992134/pexels-photo-3992134.jpeg?auto=compress&cs=tinysrgb&h=350',
            'https://images.pexels.com/photos/3992132/pexels-photo-3992132.jpeg?auto=compress&cs=tinysrgb&h=350',
            'https://images.pexels.com/photos/4686281/pexels-photo-4686281.jpeg?auto=compress&cs=tinysrgb&h=350',
            'https://images.pexels.com/photos/4146878/pexels-photo-4146878.jpeg?auto=compress&cs=tinysrgb&h=350',
            'https://images.pexels.com/photos/4113834/pexels-photo-4113834.jpeg?auto=compress&cs=tinysrgb&h=350',
            'https://images.pexels.com/photos/5945848/pexels-photo-5945848.jpeg?auto=compress&cs=tinysrgb&h=350',
            'https://images.pexels.com/photos/6157079/pexels-photo-6157079.jpeg?auto=compress&cs=tinysrgb&h=350',
            'https://images.pexels.com/photos/5946101/pexels-photo-5946101.jpeg?auto=compress&cs=tinysrgb&h=350',
            'https://images.pexels.com/photos/5946068/pexels-photo-5946068.jpeg?auto=compress&cs=tinysrgb&h=350',
            'https://images.pexels.com/photos/5946966/pexels-photo-5946966.jpeg?auto=compress&cs=tinysrgb&h=350',
            'https://images.pexels.com/photos/5946081/pexels-photo-5946081.jpeg?auto=compress&cs=tinysrgb&h=350',
            'https://images.pexels.com/photos/4114144/pexels-photo-4114144.jpeg?auto=compress&cs=tinysrgb&h=350'
          ]
        }
      }
    }
  }
})
</script>

<style>
.page
{
  display: flex;
  max-width: 80rem;
  margin: 0 auto;
  gap: 2em;
}

.page > div
{
  width: 50%;
}

.examples
{
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1em;
}

.examples > div
{
    width: 30%;
    padding: 1em;
    cursor: pointer;
}

.examples > div:hover
{
  background: #ffffff30;
}

.images
{
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
}
.images .image
{
  width: 30%;
}
.images .image img
{
  aspect-ratio: 1/1;
  width: 100%;
  object-fit: cover;
  border-radius: 1em;
}
</style>