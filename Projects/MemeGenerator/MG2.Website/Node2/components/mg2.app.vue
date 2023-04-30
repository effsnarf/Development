<template>

  <div class="meow-comp-25372">
    <div ref="appEl" class="app">
      <component is="mg2-style" class=""></component>
      <component is="mg2-analytics-tracker" class=""></component>
      <component v-show="false" ref="nav1" is="mg2-navigation" class=""></component>
      <div class="">
        <component is="mg2-page-main" class=""></component>
      </div>
    </div>
    <div class="">
      <component is="mg2-share-widget" class=""></component>
      <script type="text/javascript" src="//s7.addthis.com/js/300/addthis_widget.js#pubid=ra-58d79a1c8a1a4799"></script>
    </div>
  </div>
</template>
<script>
export default
  {
    "props": {}, "data": function () { return { "_meow": { "comp": { "_id": 25372, "name": "MG2.App" }, "rateLimit": {} }, "pageName": "home", "mgUser": null }; }, "computed": {}, "asyncComputed": {}, "methods": {
      "mounted": function () {
        this.$on(`ide-route-param-changed-pageName`, (pageName) => {
          if (!pageName) return;

          this.pageName = pageName;
        });

      }, "onLogin": function (mgUser) {
        this.mgUser = mgUser;

        this.$emit(`login`, mgUser);
        this.$root.$emit(`login`, mgUser);

      }
    }, "watch": {}, "mounted": function () {

      if (this.$getApp) this.$app = this.$getApp();



      this.$on(`ide-route-param-changed-pageName`, (pageName) => {
        if (!pageName) return;

        this.pageName = pageName;
      });



    }, "name": "MG2-App"
  }
</script>

<style scoped>
.app {
  height: 100vh;
  overflow-x: hidden;
  overflow-y: scroll;
}


h3 {
  font-size: 0.9rem
}

h4 {
  font-size: 1.3rem
}



@keyframes Loading2 {
  0% {
    background-position: 0% 0%
  }

  50% {
    background-position: 100% 0%
  }

  100% {
    background-position: 0% 0%
  }
}

.loading2 {
  padding: 0 0.5em;
  border-radius: 0.5em;
  background: linear-gradient(90deg, #00000000, #3a91f760);
  background-size: 400% 400%;

  animation: Loading2 1s ease infinite;
}
</style>