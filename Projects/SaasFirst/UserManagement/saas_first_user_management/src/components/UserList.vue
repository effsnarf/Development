<template lang="pug">
div("class"="comp-user-list")
  h3("class"="top-bar")
    div("class"="flex1")
      div()
        Transition("name"="slide-hor")
          button("class"="red", "v-if"="canDeleteSelectedUsers", "v-text"="'🗑️ delete selected users'", "@click"="onClickDeleteSelectedUsers")
      div()
        Transition("name"="slide-hor")
          div("v-if"="selectedUsers.length", "class"="text-center", "v-text"="selectedUsers.length + ' users selected'")
      div()
        Transition("name"="slide-hor")
          button("v-if"="showAddUserButton", "v-text"="'+ Add new user'", ":class"="{ disabled: !isAddUserEnabled }", "@click"="onClickAddUser")
  div("class"="header row")
    div("class"="check")
      input("type"="checkbox", "@click"="onClickSelectAll")
    div("class"="icon")
      h3()
        AppSortButton("text"="Users", "field"="name", ":sort"="sort", "@sort-by"="sortBy")
    div("v-text"="' '", "class"="name-column")
    div("class"="permission")
      h3()
        AppSortButton("text"="Permission", "field"="permission", ":sort"="sort", "@sort-by"="sortBy")
    div("v-text"="' '", "class"="buttons")
  div("class"="users-table")
    TransitionGroup("name"="slide", "class"="rows")
      UserItem("v-for"="user in pageUsers", ":key"="user.id", ":user"="user", ":newEmptyUserID"="newEmptyUserID", "@save"="onSaveUser", "@delete"="onClickDeleteUser")
  div()
    UiPager(":items-count"="users.length", ":page-size"="pageSize", "v-model"="pageIndex")
</template>

<script>
import AppSortButton from './AppSortButton.vue'
import UiPager from './UiPager.vue'
import UserItem from './UserItem.vue'

export default {
  name: 'UserList',
  components: {
    AppSortButton,
    UiPager,
    UserItem,
  },
  mixins: [],
  props: {
  },
  data() {
    return {
      users: [],
      pageIndex: 0,
      pageSize: 6,
      newEmptyUserID: -1,
      sort: {"field":"id","direction":1,"default":"id"},
    }
  },
  mounted: function() {
  this.init();
},
  methods: {
    init:
      async function() {
  const url = `/users.json`;
  const users = (await (await fetch(url)).json());
  for (const user of users) {
    user.ui = this.getNewUserUI();
  }
  this.users.splice(0, this.users.length);
  this.users.push(...users);
},
    onClickAddUser:
      function() {
  const user = this.getNewUser();
  user.ui.is.editing = true;
  this.users.push(user);
},
    onClickSelectAll:
      function() {
  const selectAllValue = !this.users.every(u => u.ui.is.selected);
  this.users.forEach(u => u.ui.is.selected = selectAllValue);
},
    onClickDeleteSelectedUsers:
      function() {
  if (this.selectedUsers.length == 1) {
    this.onClickDeleteUser(this.selectedUsers[0]);
    return;
  }
  alertify.confirm(`Delete ${this.selectedUsers.length} users?`, () => {
    this.deleteSelectedUsers();
  });
},
    deleteSelectedUsers:
      function() {
  this.selectedUsers.forEach(this.deleteUser.bind(this));
},
    onSaveUser:
      function(user) {
  if (user.id == this.newEmptyUserID) {
    user.id = this.getNewUserID();
  }
},
    onClickDeleteUser:
      function(user) {
  if (user.ui.is.editing && this.userIsEmpty(user)) {
    this.deleteUser(user);
    return;
  }
  alertify.confirm(`Do you want to delete <strong>${user.name}</strong> from the list?`, () => {
    this.deleteUser(user);
  });
},
    deleteUser:
      function(user) {
  const index = this.users.findIndex(u => u.id == user.id);
  this.users.splice(index, 1);
  this.adjust();
},
    getNewUser:
      function() {
  const colors = this.users
    .map(u => u.color.id)
    .distinct();
  const permissions = this.users
    .map(u => u.permission)
    .distinct();
  const newColorID = colors[Math.floor(Math.random() * colors.length)];
  const newPermission = permissions[permissions.length - 1];
  return {
    id: this.newEmptyUserID,
    name: ``,
    email: ``,
    permission: newPermission,
    color: {
      id: newColorID,
    },
    ui: this.getNewUserUI(),
  };
},
    getNewUserID:
      function() {
  return (this.users.length + 1);
},
    getNewUserUI:
      function() {
  return {
    is: {
      selected: false,
      editing: false,
    },
    edited: {
      name: null,
      email: null,
    }
  };
},
    getPageUsers:
      function(pageIndex) {
  const start = (pageIndex * this.pageSize);
  return this.getSortedUsers()
    .slice(start, start + this.pageSize);
},
    getSortedUsers:
      function() {
  if (!this.sort.field) return this.users;
  return this.users.sort((a, b) => {
    const fieldA = a[this.sort.field];
    const fieldB = b[this.sort.field];
    if (fieldA < fieldB) return -1 * this.sort.direction;
    if (fieldA > fieldB) return 1 * this.sort.direction;
    return 0;
  });
},
    getPageIndexes:
      function(pageCount) {
  return Array.from({ length: pageCount }, (v, i) => i);
},
    userIsEmpty:
      function(user) {
  return !user.name.length && !user.email.length;
},
    adjust:
      function() {
  if (this.pageIndex >= this.pageCount) {
    this.pageIndex = this.pageCount - 1;
  }
},
    sortBy:
      function(field) {
  if (this.sort.field == field) {
    if (this.sort.direction == 1) {
      this.sort.direction = -1;
    } else {
      this.sort.field = this.sort.default;
      this.sort.direction = 1;
    }
  } else {
    this.sort.field = field;
    this.sort.direction = 1;
  }
},
  },
  computed: {
    pageUsers: function() {
  return this.getPageUsers(this.pageIndex);
},
    selectedUsers: function() {
  return this.users.filter(u => u.ui.is.selected)
},
    canDeleteSelectedUsers: function() {
  if (!this.selectedUsers.length) return false;

  if (this.selectedUsers.length == 1 && this.selectedUsers[0].id == this.newEmptyUserID) return false;
  return true;
},
    showAddUserButton: function() {
  if (this.canDeleteSelectedUsers) return false;
  if (this.selectedUsers.length) return false;
  return true;
},
    isAddUserEnabled: function() {
  if (this.users.some(u => u.ui.is.editing)) return false;
  return true;
},
    pageIndexes: function() {
  return this.getPageIndexes(this.pageCount);
},
    pageCount: function() {
  return Math.ceil(this.users.length / this.pageSize);
},
  },
  watch: {
  },
}
</script>

<style>
.comp-user-list {
  width: min(70em, 100%);
  margin: auto;
  white-space: nowrap;
}
.users-table {
  height: 33rem;
  overflow: hidden;
}
.top-bar {
  margin: 3em;
  white-space: nowrap;
}
.top-bar button {
  padding: 0.8em 1em !important;
}
.rows {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.flex1 {
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.header.row {
  opacity: 0.7;
}
.row {
  padding: 0.5em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 1em;
  border: 1px solid transparent;
}
.rows .row {
  cursor: pointer;
}
.rows .row:hover {
  border: 1px solid #00000040;
  transition: 0s;
}
.check {
  flex-shrink: 1;
  width: 4em;
  display: flex;
  justify-content: center;
}
.icon {
  width: 4em;
  flex-shrink: 1;
}
.name-column {
  padding: 0 1em;
  flex-grow: 1;
}
.permission {
  width: 10em;
}
.circle {
  display: flex;;
  align-items: center;;
  justify-content: center;;
  width: 100%;
  aspect-ratio: 1;
  font-size: 1.5em;
  border-radius: 50%;
  color: white;;
}
.buttons {
  display: flex;
  align-items: center;
  width: 14em;
  gap: 0.5em;
  opacity: 0;
  transition: 1s;
}
.comp-user-item-edit .buttons, .row:hover .buttons {
  opacity: 1 !important;
}
h3 button {
  padding: 0.5em 1.2em !important;
}
button.clear {
  padding: 0.5em;
}
button.clear:hover {
  background: #00000020;
}
input, select {
  padding: 0.2em 0.5em;
  font-size: 120%;
  border-radius: 0.2em;
  border: 1px solid gray;
}
</style>