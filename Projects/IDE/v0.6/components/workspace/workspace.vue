
<template lang="pug">
div.workspace.flex.g-1em(v-if="ws", :key="key1")
  div.w-5pc
    workspace-toolbar

  .box.w-20pc
    h3
      span tree1
      span.opacity-50(v-text="` [🗝${ws.tree1?.key}]`")
    div
      //pre {{ util.app.getComponentTree(ws.tree1.get()) }}
      //tree(v-if="ws.tree1", :ui-state="ws.treeUiState1", :tree="ws.tree1", :node="util.app.getComponentTree(ws.tree1.get())", node-component="tree-node-a", @node-hovered="onNodeHovered", @node-selected="selection.selected._id=$event?._id", :selection="selection")
      //br
      tree(v-if="ws.tree1", :ui-state="ws.treeUiState1", :tree="ws.tree1", :node="ws.tree1.get()", node-component="tree-node-a", @node-hovered="onNodeHovered", @node-selected="selection.selected._id=$event?._id", @node-drop="(...args) => ws.onLayoutDrop(...args)", :selection="selection")
      

  div.w-50pc
    layout-transition(ref="layoutTransition1")
      app-application(:state-db="ws.appStateDb", :app-switchboard="ws.switchboard", :app-source="ws.tree1", :node="ws.tree1.get()", :selection="selection")

    br

    object-value-picker(:node="ws.getDemoNode()", prop-path="style.shadow" :options="ws.getShadowOptions()", @prop-change="(...args) => ws.onPropChange(selection?.selected?._id, ...args.slice(1))")
    
    object-value-picker(:node="ws.getDemoNode()", prop-path="style.background.color" :options="ws.getColorOptions()", @prop-change="(...args) => ws.onPropChange(selection?.selected?._id, ...args.slice(1))")
    
    br

    div(v-if="(ws.tree1?.getNode(selection?.selected?._id)?.type == 'layout.panel')")
      object-value-picker(:node="ws.tree1?.getNode(selection?.selected?._id)", prop-path="direction" :options="['horizontal', 'vertical']", @prop-change="(...args) => ws.onPropChange(...args)")

  div.w-25pc.flex.flex-column(style="gap: 1em;")
    ide-switchboard(:app-source="ws.tree1", :switchboard="ws.switchboard", @node-hovered="onNodeHovered")

    ide-logger

    transition(name="fade")
      .box(v-if="selection?.selected?._id", :key="selection?.selected?._id")
        h3
          span {{ util.getNodeIcon(ws.tree1?.getNode(selection?.selected?._id).type) }}
          span &nbsp; {{ util.getNodeDesc(ws.tree1, ws.tree1?.getNode(selection?.selected?._id)) }}
          span.opacity-50 &nbsp; {{ selection?.selected?._id }}
        layout-transition
          app-layout-comp(:key="ws.tree1?.key", :node="ws.tree1.getNode(selection?.selected?._id)", :selection="selection")
        br
        object-editor(:node="ws.tree1?.getNode(selection?.selected?._id)", @prop-change="(...args) => ws.onPropChange(...args)")

    action-stack(ref="actionStack1", :action-stack="ws.actionStack", :enabled="actionsEnabled")

</template>


<script>
import { msg } from '~/code/util/msg';
import { Utility } from '~/code/util/utility';

export default {
    props: {
      workspace: {
        required: true
      }
    },
    data() {
      return {
        key1: 1,
        actionsEnabled: true,
        selection: {
          hovered: {
            _id: null
          },
          selected: {
            _id: null
          }
        },
        ws: null,
        util: Utility
      }
    },
    mounted() {
        setTimeout(this.init.bind(this), 1000);
    },
    methods: {
        async init() {
          return;
            // Wrap ActionStack.do() with a LayoutTransitions.snapshot() and animate().
            let originalExecute = this.ws.actionStack.execute.bind(this.ws.actionStack);
            this.ws.actionStack.execute = async (...args) => {
                this.$refs.layoutTransition1.snapshot();
                this.actionsEnabled = false;
                let action = (await originalExecute(...args));
                setTimeout(async () => {
                    await this.$refs.layoutTransition1.animate();
                    this.actionsEnabled = true;
                }, 0);
                //this.refresh();
                return action;
            };
        },
        onNodeHovered(node) {
            this.selection.hovered._id = node?._id;
        },
      refresh() {
        this.key1++;
      }
    },
    watch: {
        workspace: {
            handler: function (newValue, oldValue) {
                this.ws = newValue;
            },
            immediate: true
        }
    },
  }
</script>


<style scoped>
.workspace > div
{
    flex-grow: 1;
}
</style>
