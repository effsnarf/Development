<template lang="pug">
div("class"="comp-app-menu")
  div("v-for"="menu in menus", "class"="menu1")
    div("v-text"="menu.category", "class"="title")
    AppMenuItem("v-for"="item in menu.items", ":key"="item", ":image"="getImageUrl(item)", ":text"="item", ":active"="item == activeItem")
</template>

<script>
import AppMenuItem from "./AppMenuItem.vue";

export default {
  name: "AppMenu",
  components: {
    AppMenuItem,
  },
  data() {
    return {
      menus: [
        {
          category: "Messages",
          items: ["Inbox", "Outbound", "Contacts", "Statistic"],
        },
        {
          category: "Tools",
          items: ["Chat editor", "Automation", "Site tools"],
        },
        { category: "Settings", items: ["General", "Account", "Billing"] },
      ],
      activeItem: "Inbox",
    };
  },
  methods: {
    getImageUrl: function (item) {
      return "/images/" + item.toLowerCase().replace(" ", "-") + ".png";
    },
  },
};
</script>

<style>
.menu1 {
  margin: 2em auto;
}
.title {
  width: 9.5em;
  margin: 0.4em auto;
  font-weight: bold;
  text-transform: uppercase;
}
</style>
