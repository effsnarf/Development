<template lang="pug">
UserItemView("v-if"="!user.ui.is.editing", ":user"="user", ":newEmptyUserID"="newEmptyUserID", ":permissionTexts"="permissionTexts", "v-on"="$listeners", ":class"="{ row: true, selected: user.ui.is.selected }", "class"="comp-user-item")
UserItemEdit("v-else-if"="user.ui.is.editing", ":user"="user", ":newEmptyUserID"="newEmptyUserID", ":permissionTexts"="permissionTexts", "v-on"="$listeners", ":class"="{ row: true, selected: user.ui.is.selected }")
</template>

<script>
import UserItemEdit from "./UserItemEdit.vue";
import UserItemView from "./UserItemView.vue";

export default {
  name: "UserItem",
  components: {
    UserItemEdit,
    UserItemView,
  },
  props: {
    user: {
      default: null,
    },
    newEmptyUserID: {
      default: null,
    },
  },
  data() {
    return {
      permissionTexts: ["Admin", "Agent"],
    };
  },
  mounted: function () {
    Object.keys(this.$listeners).forEach((event) => {
      this.$on(event, () => {
        this.$emit(event);
      });
    });
  },
  methods: {
    onClickUser: function (user, e) {
      if (e.target != e.currentTarget) return;
      if (user.id == this.newEmptyUserID) return;
      user.ui.is.selected = !user.ui.is.selected;
    },
  },
};
</script>

<style></style>
