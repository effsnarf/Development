<template lang="pug">
div.box
    h3
        span Switchboard
    table.stats
        tr
            td
                sub node values
            td
                data-number(:value="Object.keys(entries).length")
        tr
            td
                sub vue comps
            td
                data-number(:value="switchboard?.rtMvcComps.compCount")
    table
        tr(v-for="entry in entries", :class="`${entry.state} ${entry.cssClass}`", @mouseenter="onMouseEnter(entry)", @mouseleave="onMouseLeave(entry)")
            td.icon {{ entry.icon }}
            td.desc {{ entry.desc }}
            td.value
                data-something(:value="entry.value")
            td.text-right
                data-milliseconds(v-if="entry.elapsed", :value="entry.elapsed")
</template>

<script>
import { Utility } from '~/code/util/utility';
import { TaskQueue } from '~/code/util/task-queue';

export default {
    props: {
        appSource: {
            type: Object,
            required: true
        },
        switchboard: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            entries: ref({}),
            signalUpdates: new TaskQueue(),
        }
    },
    methods: {
        onMouseEnter(entry) {
            this.$emit(`node-hovered`, entry.node);
        },
        onMouseLeave(entry) {
            this.$emit(`node-hovered`, null);
        },
        onNodeUpdate(nodePath, update) {
            let entry = this.entries[nodePath] = this.getEntry(nodePath);
            Object.assign(entry, update);
            this.signalUpdates.enqueue(async () => {
                entry.cssClass = `updating`;
                setTimeout(() => {
                    entry.cssClass = null;
                }, 400);
            });
        },
        getEntry(nodePath) {
            if (this.entries[nodePath]) return this.entries[nodePath];
            let nodeID = parseInt(nodePath.split('.').pop() || '');
            let node = this.appSource.getNode(nodeID);
            let icon = Utility.getNodeIcon(node.type);
            let desc = Utility.getNodeDesc(null, node);
            return {
                node: {
                    _id: nodeID
                },
                icon,
                desc,
                value: null
            }
        },
    },
    watch: {
        switchboard: {
            handler: function (newSb, oldSb) {
                if (!newSb) return;
                newSb.events.on(`node-update`, this.onNodeUpdate);
            },
            immediate: true,
        }
    },
}
</script>

<style scoped>
.stats
{
    position: absolute;
    top: 0.5em;
    right: 0.5em;
}
.stats td
{
    text-align: right;
    padding-left: 0.5em;
}
.value
{
    opacity: 0.5;
}
.value > div
{
    width: 12em;
}
.idle
{
}
.running,
.updating .value
{
    font-weight: bold;
    transition: 0s;
    opacity: 1;
}
.running .icon
{
    /* Loop rotating on the Y axis */
    animation: rotate-y 0.4s infinite;
}
.icon
{
    text-align: center;
    white-space: nowrap;
}

/* Animation */
/* From 2px dashed white border gradually disappearing (transparent) */
@keyframes running-to-idle
{
    0% { border: 2px dashed #aaa; }
    100% { border: 2px dashed transparent; }
}

/* Animation */
/* Rotate on the Y axis */
@keyframes rotate-y
{
    0% { transform: rotateY(0deg); }
    100% { transform: rotateY(360deg); }
}
</style>
