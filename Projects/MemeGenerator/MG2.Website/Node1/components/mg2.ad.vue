<template>

  <div class="meow-comp-25411">
    <div :key="key1" class="">
      <div v-if="showPlaceholder" class="ad-placeholder"></div>
      <div class="ad-container">
        <div v-if="(type == `mobile-app`)" class="">
          <div style="gap: 2em;" class="flex flex-column">
            <component url="https://play.google.com/store/apps/details?id=meme.generator" target="_blank" is="mg2-link"
              class="">
              <template>
                <div style="gap: 1em;" class="flex">
                  <img src="https://memegenerator.net/img/google-play-logo.png" class="w-l4" />
                  <div class="">Download the official Meme Generator mobile app on Google Play</div>
                </div>
              </template>
            </component>
            <div class="hidden">
              <a target="_blank" href="https://meow.energy" class="">
                <img src="https://i.imgur.com/kKyHo1R.jpeg" class="w-100pc" />
                <div class="text-center">Get in, we're writing 4chan The Movie.</div>
              </a>
            </div>
          </div>
        </div>
        <div v-if="(type == `squares`)" class="">
          <div v-if="(adNetwork == `adblade`)" class="">
            <div class="ad ad-100pcx500">
              <iframe src="/ads/Adblade/6large.html" scrolling="no" class=""></iframe>
            </div>
          </div>
        </div>
        <div v-if="(type == `leaderboard`)" class="">
          <div v-if="(adNetwork == `rubicon`)" class="">
            <div class="ad ad-728x90">
              <iframe src="/ads/rubicon/728x90.html" scrolling="no" class=""></iframe>
            </div>
          </div>
        </div>
        <div v-if="(type == `vertical`)" class="">
          <div v-if="(adNetwork == `adblade`)" class="">
            <div>
              <ins data-cid="46497-1605436040" data-host="web.adblade.com" data-tag-type="4" data-protocol="https"
                style="display:none" class="adbladeads"></ins>
              <script async="true" src="https://web.adblade.com/js/ads/async/show.js" type="text/javascript"></script>
            </div>
          </div>
          <div v-if="(adNetwork == `rubicon`)" class="">
            <div class="">
              <div class="ad ad-160x600">
                <iframe src="/ads/rubicon/160x600.html" scrolling="no" class=""></iframe>
              </div>
            </div>
          </div>
          <div v-if="(adNetwork == `google`)" class="">
            <ins style="display:block" data-ad-client="ca-pub-8637884354286038" data-ad-slot="9949354351"
              data-ad-format="auto" data-full-width-responsive="true" class="adsbygoogle"></ins>
            <script>
              (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
          </div>
        </div>
        <div v-if="(type == `square`)" class="">
          <div v-if="(adNetwork == `rubicon`)" class="">
            <div class="ad ad-300x250">
              <iframe src="/ads/rubicon/300x250.html" scrolling="no" class=""></iframe>
            </div>
          </div>
          <div v-if="(adNetwork == `google`)" class="">
            <ins style="display:block" data-ad-client="ca-pub-8637884354286038" data-ad-slot="4812577748"
              data-ad-format="auto" data-full-width-responsive="true" class="adsbygoogle"></ins>
            <script>
              (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default
  {
    "props": { "type": null, "adNetwork": null, "side": null }, "data": function () { return { "_meow": { "comp": { "_id": 25411, "name": "MG2.Ad" }, "rateLimit": {} }, "key1": 0 }; }, "computed": {
      "showPlaceholder": {
        "get": function () {
          return (!this.$nuxt);
        }
      }, "uniqueID": {
        "get": function () {
          return Date.now();
        }
      }
    }, "asyncComputed": {}, "methods": {
      "refresh": function () {
        this.key1++;

      }, "mounted": function () {
        this.$root.$on(`page-view`, this.refresh.bind(this));


      }
    }, "watch": {}, "mounted": function () {

      if (this.$getApp) this.$app = this.$getApp();



      this.$root.$on(`page-view`, this.refresh.bind(this));




    }, "name": "MG2-Ad"
  }
</script>

<style scoped>
* {
  color: white;
  text-shadow: none;
}

.ad-placeholder {
  padding: 1em;
  font-size: 3rem;
  text-align: center;
  text-transform: uppercase;
  border-radius: 1rem;
  background: #ffffff60;
  opacity: 0.5;
}

.ad {}

.ad-100pcx500 {
  width: 100%;
  height: 500px;
  margin: auto;
}

.ad-160x600 {
  width: 160px;
  height: 600px;
  margin-top: 5em;
}

.ad-300x250 {
  width: 300px;
  height: 250px;
  margin: auto;
}

.ad-728x90 {
  width: 728px;
  height: 90px;
  margin: auto;
}

iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>