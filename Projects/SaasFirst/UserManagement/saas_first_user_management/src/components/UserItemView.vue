<template lang="pug">
div("@click"="(e) => $emit('click', user, e)", "class"="comp-user-item-view")
  div("class"="check")
    input("type"="checkbox", "v-if"="user.id != newEmptyUserID", "v-model"="user.ui.is.selected")
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
  name: 'UserItemView',
  components: {
  },
  mixins: [],
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
    }
  },
  mounted: function() {
  this.userColors = { '1': '#DE40A3', '2': '#1C40A3', '3': '#31F1AC' };
},
  methods: {
    startEditing:
      function(user) {
  user.ui.is.editing = true;
  user.ui.edited.name = user.name;
  user.ui.edited.email = user.email;
},
    deleteUser:
      function(user, e) {
  e.stopPropagation();
  this.$emit('delete', user);
},
    getInitials:
      function(user) {
  return user.name.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
},
  },
  computed: {
  },
  watch: {
  },
}
</script>

<style>
h3.name input {
  color: black;
}
.selected, .selected:hover {
  background: linear-gradient(45deg, #00000010, #00000030) !important;
}
.permission .button {
  padding: 0 0.8em;
  color: gray;
  border-radius: 0.7em;
  font-size: 1.1rem;
}
.permission .button:hover {
  color: black;
}
.permission .button-admin {
  background: #EFE2FE;
}
.permission .button-agent {
  background: #C8E7F9;
}
</style>