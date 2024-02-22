<template lang="pug">
div("@click"="(e) => $emit('click', e)", "class"="comp-user-item-edit")
  div("class"="check")
    input("type"="checkbox", "v-if"="user.id != newEmptyUserID", "v-model"="user.ui.is.selected")
  div("class"="edit-column")
    table
      thead
        tr
          th("v-text"="'Name'")
          th("v-text"="'Email'")
          th("v-text"="'Permission'")
      tbody
        tr
          td
            input("type"="text", "placeholder"="Enter Name", "v-model"="user.ui.edited.name")
          td
            input("type"="text", "placeholder"="Enter Email", "v-model"="user.ui.edited.email")
          td
            select(":disabled"="true", ":value"="(permissionTexts.length - 1)")
              option("v-for"="(text, id) in permissionTexts", ":value"="id", "v-text"="text")
  div("class"="buttons")
    div
      h3
        div("class"="flex")
          Transition("name"="slide-hor")
            button("class"="save", "title"="Save", ":disabled"="!canSave(user)", "v-text"="getSaveButtonText(user)", "@click"="() => saveEditing(user)")
          button("class"="gray cancel", "title"="Cancel", "v-text"="'Cancel'", "@click"="() => cancelEditing(user)")
</template>

<script>

export default {
  name: 'UserItemEdit',
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
    }
  },
  methods: {
    saveEditing:
      function(user) {
  user.ui.is.editing = false;
  user.name = user.ui.edited.name;
  user.email = user.ui.edited.email;
  this.$emit('save', user);
},
    canSave:
      function(user) {
  if (!user.ui.is.editing) return false;
  if (!user.ui.edited.name?.length) return false;
  if (!user.ui.edited.email?.length) return false;
  return true;
},
    cancelEditing:
      function(user) {

  if (user.id == this.newEmptyUserID) {
    this.$emit('delete', user);
    return;
  }
  user.ui.is.editing = false;
},
    getSaveButtonText:
      function(user) {
  if (user.id == this.newEmptyUserID) return 'Add';
  return 'Save';
},
  },
  computed: {
  },
  watch: {
  },
}
</script>

<style>
.edit-column {
  flex-grow: 1;
  padding-right: 2em;
  opacity: 0.8;
}
.edit-column th {
  padding: 0.5em;
  opacity: 0.7;
}
.edit-column thead {
  margin: 5px;
}
.edit-column tbody {
  opacity: 0.5;
}
.edit-column td {
  padding-right: 1em;
}
.edit-column input {

}
.comp-user-item-edit input[type=text], .comp-user-item-edit select {
  width: 228px;
  height: 46px;
  padding: 0 1em;
  border-radius: 0.5em;
  opacity: 1 !important;
}
select[disabled] {
  background: #F1F1F1;
}
.comp-user-item-edit.row {
  align-items: end;
}
.comp-user-item-edit .check {
  width: 4px;
}
.comp-user-item-edit .check input[type=checkbox] {
  display: none;
}
</style>