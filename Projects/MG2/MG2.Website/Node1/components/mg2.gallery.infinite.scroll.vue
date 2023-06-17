<template>

  <div class="meow-comp-25410 relative">
    <div v-if="isLoading" class="loading"></div>
    <transition-group tag="div" name="slide-in-list-large" class="gallery">
      <div v-for="(item, index) in items" :key="getItemKey(item)" :class="{ selected: areEqual(item, selectedItem) }"
        :style="{ 'transition-delay': `calc(0.1s * ${index})` }" class="mb-8">
        <component :is="getItemComponentName(item)" v-bind="getItemPropsObj(item)" class=""></component>
      </div>
    </transition-group>
  </div>
</template>
<script>
export default
  {
    "props": { "getItems": null, "scrollBuffer": { "default": 2000 }, "itemProps": null, "selectedItem": null }, "data": function () { return { "_meow": { "comp": { "_id": 25410, "name": "MG2.Gallery.Infinite.Scroll" }, "rateLimit": {} }, "items": [], "scrollPos": null, "scrollMax": null, "isLoading": null, "pageIndex": 0, "adItemKey": 0, "lastLoaded": null }; }, "computed": {}, "asyncComputed": {}, "methods": {
      "loadMore": async function (clear) {
        if (!this.getItems) return;
        if (this.isLoading) return;

        this.isLoading = true;

        try {
          let lastItem = [...this.items].reverse().find(it => (!it.ad));

          let newItems = (await this.getItems(this.pageIndex, lastItem));

          newItems.splice((newItems.length / 2), null, this.getAdItem());

          this.items.push(...newItems);

          this.items.push(this.getAdItem());

          this.pageIndex++;

          if (this.pageIndex > 1) this.$root.$emit(`page-view`, `${window.location.pathname}/${this.pageIndex}`);
        }
        finally {
          this.lastLoaded = Date.now();
          this.isLoading = false;
          setTimeout(this.loadShareScript.bind(this), 1000);
        }


      }, "mounted": function () {
        let scrollEl = this.getScrollElement();

        scrollEl.addEventListener(`scroll`, this.onScroll);

        setTimeout(async () => {
          this.onScroll();
        }, 200);

      }, "getItemPropsObj": function (item) {
        if (item.ad) return item.ad;

        let obj = {};

        obj.generator = item;
        obj.largeTitle = true;

        obj.instance = item;

        if (this.itemProps) obj = { ...obj, ...this.itemProps };

        return obj;

      }, "getScrollElement": function () {
        if (typeof ($) == 'undefined') return null;

        return ($(this.$el).parents(`.app`).get(0) || document.body);

      }, "onScroll": async function () {
        let el = this.getScrollElement();

        this.scrollPos = (el.scrollTop + el.clientHeight);
        this.scrollMax = (el.scrollHeight);

        if ((this.scrollPos + this.scrollBuffer) >= this.scrollMax) await this.loadMore();

        let data = this.getVisibleItemData();

        this.$emit(`scroll`, { scrollTop: Math.round(el.scrollTop), visibleItem: data });

      }, "unmounted": function () {
        let scrollEl = this.getScrollElement();

        scrollEl.removeEventListener(`scroll`, this.onScroll);

      }, "getItemKey": function (item) {
        if (!item) return null;

        return item.key ||
          item.commentID ||
          item.instanceID ||
          item.generatorID;

      }, "clear": function () {
        this.pageIndex = 0;
        this.items = [];

        let isProd = ((typeof (window) != `undefined`) && (window.$nuxt));

        if (isProd) {
          let scrollEl = this.getScrollElement();
          $(scrollEl).animate({ scrollTop: 0 }, 2000);
        }

        this.$nextTick(() => {
          this.loadMore();
        });

      }, "getItemComponentName": function (item) {
        if (item.ad) {
          if ((typeof (window) != `undefined`) && (!window.$nuxt)) return `meow-comp-25411`;

          return `mg2-ad`;
        }

        let compName = (item.instanceID) ? `mg2-instance` :
          (item.generatorID) ? `mg2-generator` : null;

        if (!window.$nuxt) {
          switch (compName) {
            case `mg2-instance`: return `meow-comp-25341`;
            case `mg2-generator`: return `meow-comp-25343`;
          }
        }

        return compName;


      }, "getAdItem": function () {
        //let rnd = Math.round(Math.random() * 1);
        //let adType = [`text`, `square`][rnd];

        return {
          key: `ad-${++this.adItemKey}`,
          ad: { type: `square`, adNetwork: `rubicon` }
        };

      }, "areEqual": function (item1, item2) {
        return (this.getItemKey(item1) == this.getItemKey(item2));

      }, "getVisibleItemData": function () {
        if (!this.$refs?.itemEls?.length) return;

        let el = this.getScrollElement();

        let scrollTop = el.scrollTop;

        var i = 0;
        for (var vue of this.$refs.itemEls) {
          let el = (vue.$el || vue);
          let elTop = el.offsetTop;
          let elHeight = el.offsetHeight;
          if ((elTop >= scrollTop) && (elTop < (scrollTop + elHeight))) return {
            index: i,
            offsetTop: el.offsetTop
          };
          i++;
        }

        return null;

      }, "scrollTo": function (offsetTop) {
        let el = this.getScrollElement();

        el.scrollTo({ top: offsetTop, behavior: 'smooth' });

      }, "scrollToItem": function () {

      }, "loadShareScript": function () {
        return;
        
        let url = `//cdn.social9.com/js/socialshare.min.js`;
        let content = `537e87dc3b5341119b8e79333f9703f3`;

        var script = document.createElement("script");

        script.content = content;
        script.src = url;

        document.documentElement.firstChild.appendChild(script);
      }
    }, "watch": {
      "getItems": {
        "deep": true, "immediate": true, "handler": async function (newGetItems, oldGetItems) {
          this.clear();

        }
      }, "items": {
        "deep": true, "immediate": false, "handler": async function (newItems, oldItems) {
          this.$emit(`items-changed`, newItems);

        }
      }
    }, "unmounted": function () {
      let scrollEl = this.getScrollElement();

      scrollEl.removeEventListener(`scroll`, this.onScroll);

    }, "mounted": function () {

      if (this.$getApp) this.$app = this.$getApp();



      let scrollEl = this.getScrollElement();

      scrollEl.addEventListener(`scroll`, this.onScroll);

      setTimeout(async () => {
        this.onScroll();
      }, 200);



    }, "name": "MG2-Gallery.Infinite.Scroll"
  }
</script>

<style scoped>
.gallery {
  display: grid;
  grid-template: 1fr / 1fr;
  gap: 1em;
}

@media (max-width: 1400px) {
  .gallery {
    grid-template: 1fr / 1fr;
  }
}

@media (max-width: 1000px) {
  .gallery {
    grid-template: 1fr / 1fr;
  }
}
</style>