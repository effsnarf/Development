<template lang="pug">
div("@click"="(e) => $emit('click', user, e)", "class"="comp-user-item-view")
  div("class"="check")
    input("type"="checkbox", "v-if"="user.id != newEmptyUserID", ":class"="{ checked: user.ui.is.selected }", "v-model"="user.ui.is.selected")
  div("class"="icon")
    div(":style"="{ background: userColors[user.color.id] }", "v-text"="getInitials(user)", "class"="circle")
  div("class"="name-column")
    h3("class"="name", "v-text"="user.name")
    div("v-text"="user.email", "class"="email")
  div("class"="permission")
    div("v-if"="(user.permission != null)", ":class"="'button button-' + user.permission", "v-text"="user.permission.toTitleCase()")
  div("class"="buttons")
    div
      button("class"="clear edit", "title"="Edit", "v-if"="!user.ui.is.editing", "@click"="(e) => startEditing(user, e)")
        span("v-text"="'✏️'")
    div("v-if"="!user.ui.is.editing")
      button("class"="clear delete", "@click"="(e) => deleteUser(user, e)")
        span("v-text"="'🗑️'")
</template>

<script>
export default {
  name: "UserItemView",
  props: {
    user: {
      default: null,
    },
    newEmptyUserID: {
      default: null,
    },
    permissionTexts: {
      default: null,
    },
  },
  data() {
    return {
      userColors: {},
    };
  },
  mounted: function () {
    this.userColors = { 1: "#DE40A3", 2: "#1C40A3", 3: "#31F1AC" };
  },
  methods: {
    startEditing: function (user) {
      user.ui.is.editing = true;
      user.ui.edited.name = user.name;
      user.ui.edited.email = user.email;
    },
    deleteUser: function (user, e) {
      e.stopPropagation();
      this.$emit("delete", user);
    },
    getInitials: function (user) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    },
  },
};
</script>

<style>
h3.name input {
  color: black;
}
.permission .button {
  color: #624d9ce0;
  font-size: 1rem;
  padding: 0.4em 1em;
  border-radius: 0.7em;
  opacity: 1 !important;
}
.permission .button-admin {
  background: #efe2fe;
}
.permission .button-agent {
  background: #c8e7f9;
}
</style>
