<template lang="pug">
div
  h1 IDE
  div.absolute-bottom-right.m-l1
    button(@click="refresh()") refresh {{ key1 }}
  div(:key="key1")
    workspace(ref="workspace1", :workspace="ws")
    trash-can(@trashcan-drop="onTrashCanDrop")
</template>

<script>
import { Workspace } from '~/code/workspace/workspace';

export default {
  data() {
    return {
      key1: 0,
      hovered: {
        node: null
      },
      userActionsEnabled: true,
      ws: null,
    }
  },
  async mounted() {
      this.console = window.console;

      this.ws = (await Workspace.construct());

    },
    methods: {
      async onTrashCanDrop(dragItem, dropItem) {
        // Deselect the node if it was deleted
        //if (dragItem._id === this.$refs.workspace1.selection.selected._id) {
          //this.ws.do('workspace', 'set', ['selected.node', null]);
        //}

        this.ws.actionStack.doGroup('Delete node', async () => {
          // Delete the node
          await this.ws.do('tree1', 'deleteNode', [dragItem._id]);
          // Delete all the links that reference the node
          await this.ws.do('tree1', 'deleteNodes', [n => ([n.from, n.to].includes(dragItem._id))]);
        });
      },
      async refresh() {
        // Refresh 5 times with a delay of 50ms
        for (let i = 0; i < 5; i++) {
          setTimeout(this._refresh.bind(this), 50 * i);
        }
      },
      _refresh() {
        this.key1++;
      },
      getDbItems() {
        if (!this.db?.items) return null;

        let entries = Object.entries(this.db.items);

        // Sort the entries by the size of the value
        entries.sort((a, b) => {
          let aSize = JSON.stringify(a[1]).length;
          let bSize = JSON.stringify(b[1]).length;

          return (aSize - bSize);
        });

        // Conver the entries to a dictionary
        let items = Object.fromEntries(entries);

        return items;
      }
    }
}
</script>


<style scoped>
.cunt
{
  color: pink;
}
</style>