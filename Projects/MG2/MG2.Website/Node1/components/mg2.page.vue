<template>

  <div class="meow-comp-25337">
    <div class="screen">
      <div class="sticky header">
        <component is="mg2-header" class=""></component>
      </div>
      <div class="ads-grid">
        <div class="ad vertical sticky">
          <component type="vertical" ad-network="rubicon" side="a" is="mg2-ad" class=""></component>
        </div>
        <div class="page-width">
          <div class="page-grid anim-page-center">
            <div class="sticky sidebar-left">
              <component is="mg2-sidebar" class=""></component>
              <slot name="sidebar-left" class=""></slot>
            </div>
            <div class="page-body">
              <div class="">
                <slot name="body" class=""></slot>
              </div>
              <div class="sticky">
                <slot name="body2" class=""></slot>
              </div>
            </div>
            <div class="page-grid-column3 sticky">
              <slot name="sidebar-large" class=""></slot>
            </div>
          </div>
        </div>
        <div class="ad vertical sticky">
          <component type="vertical" ad-network="rubicon" side="b" is="mg2-ad" class=""></component>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default
  {
    "props": { "isContentCentered": null }, "data": function () { return { "_meow": { "comp": { "_id": 25337, "name": "MG2.Page" }, "rateLimit": {} }, "adKey1": 0 }; }, "computed": {}, "asyncComputed": {}, "methods": {
      "mounted": function () {
        this.$root.$on(`page-view`, this.refreshAd);

      }, "refreshAd": function () {
        this.adKey1++;

      }
    }, "watch": {}, "mounted": function () {

      if (this.$getApp) this.$app = this.$getApp();



      this.$root.$on(`page-view`, this.refreshAd);



    }, "name": "MG2-Page"
  }
</script>

<style scoped>
* {
  border-radius: 0;
}


.page-body {
  display: grid;
  grid-template: 1fr / 350px 1fr;
  gap: 2em;
}

.page-body>div {
  flex: 1;
}


.ads-grid {
  display: grid;
  grid-template: 1fr / 160px 1fr 160px;
  grid-gap: 1em;
}


.page-grid {
  display: grid;
  grid-gap: 1.5rem;
}

.gallery-1 {
  display: grid;
  grid-template: 1fr / 1fr 1fr 1fr;
  grid-gap: 3%;
}




.anim-page-center {
  transition: 1s;
}

.anim-page-center.on {
  transform: translate(25%);
}

.page-grid {
  grid-template: 1fr / 15% 65% 20%;
}


.page-grid-column3 {
  width: 93%;
  max-height: 84vh;
  overflow-x: hidden;
  overflow-y: scroll;
}


.page-grid-sidebars {
  display: grid;
  grid-template: 1fr / minmax(50%, 66%) minmax(34%, 50%);
  gap: 1em;
}

@media (max-width: 1400px) {

  .sticky-header,
  .page-width {
    padding: 0 1em;
  }
}

@media (max-width: 1200px) {
  .page-grid-sidebars {
    grid-template: 1fr / 75% 25%;
  }

  .ads-grid {
    grid-template: 1fr / 1fr;
  }

  .ad.vertical {
    display: none;
  }
}

@media (max-width: 1100px) {
  .page-grid-sidebars {
    grid-template: 1fr / 75% minmax(15%, 25%);
  }
}

@media (max-width: 900px) {
  .page-grid {
    grid-template: 1fr / 10% 50% 33%;
  }

  .page-grid-sidebars {
    grid-template: 1fr / 1fr;
  }

  .sidebar-righter {
    display: none;
  }
}

@media (max-width: 600px) {
  .page-grid {
    grid-template: 1fr / 30% calc(70% - 2em);
  }

  .sidebar-right {
    display: none;
  }
}

@media (max-width: 480px) {
  .page-grid {
    grid-template: 1fr / 20% calc(80% - 2em);
  }
}

.sidebar-right,
.sidebar-righter {
  max-height: 80vh;
  overflow-x: hidden;
  overflow-y: hidden;
}


.sticky.header {
  top: 0;
  background: linear-gradient(142deg, #1469e1, #001330 22%, #00569f);
  margin-bottom: 1rem;
  z-index: 1000;
  box-shadow: -10px 10px 10px #000000a0;
}

.screen {
  background: linear-gradient(142deg,
      rgba(6, 43, 95, 1) 0%,
      rgba(0, 19, 48, 1) 22%,
      rgba(0, 86, 159, 1) 100%);
}


h3 {
  font-size: 0.8em;
}

a {
  color: white;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.loading::before {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  content: "⌛";
  font-size: 2rem;
}

.loading {
  opacity: 0.6;
  text-align: center;
  animation: rotate 3s ease-in-out infinite;
}

@keyframes pulsate {
  from {
    opacity: 0.4;
  }

  to {
    opacity: 0.8;
  }
}

@keyframes rotate {
  0% {
    transform: rotateZ(0deg);
  }

  50% {
    transform: rotateZ(180deg);
  }

  100% {
    transform: rotateZ(360deg);
  }
}
</style>