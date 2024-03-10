<template lang="pug">
div("class"="comp-instance")
  AppBox
    template("v-slot:content")
      div
        img("class"="instance-image", ":src"="getInstanceImageUrl(instance?.instanceID)")
      AppCommentList(":instanceID"="instanceID", ":comments"="comments")
</template>

<script>
export default {
  name: "Instance",
  props: {
    instanceID: {
      default: null,
    },
  },
  data() {
    return {
      instance: null,
    };
  },
  mounted: async function () {
    await this.init();
  },
  methods: {
    init: async function () {
      const instanceID = this.instanceID;
      const url1 = `https://db.memegenerator.net/MemeGenerator/api/Instances/select/one?instanceID=${instanceID}`;
      this.instance = await (await fetch(url1)).json();
    },
    getInstanceImageUrl: function (instanceID) {
      if (!instanceID) return null;
      return `https://img.memegenerator.net/instances/${instanceID}.jpg`;
    },
  },
};
</script>

<style scoped>
.instance-image {
  display: block;
  width: 50%;
  margin: auto;
  margin-bottom: 3em;
  border-radius: 0.5em;
  box-shadow: -4px 4px 4px #888;
}
</style>
