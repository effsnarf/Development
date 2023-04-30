<template lang="pug">
div
    div.item-details(v-if="detailsItem")
        div.box
            h3 {{ detailsItem.icon}} {{ (detailsItem.text) }}
            h3.opacity-50 {{ detailsItem.cls }}
            h3.opacity-50 {{ detailsItem.method }}
            pre {{ detailsItem.data }}
    div.box
        h3
            span Logger
            span.ml-1.opacity-50 ({{ logger.items.length }})
        div.items
            transition-group(name="fade-move", tag="table")
                tr(v-for="(item, index) in [...logger.items].reverse()", :key="item.dt", :class="getItemClass(item)", @mouseenter="onMouseEnter(item)", @mouseleave="onMouseLeave(item)", @click="onClick(item)")
                    td.id.opacity-50 {{ item.id }}
                    td.icon {{ item.icon }}
                    td {{ (item.text || item.method) }}
                    td
                        div {{ item.data }}
</template>

<script>
import { Logger } from '~/code/util/logger';

export default {
    props: {
    },
    data() {
        return {
            hovered: {
                item: null
            },
            selected: {
                item: null
            }
        }
    },
    watch: {
    },
    methods: {
        onMouseEnter(item) {
            this.hovered.item = item;
        },
        onMouseLeave(item) {
            this.hovered.item = null;
        },
        onClick(item) {
            if (item == this.selected.item) item = null;
            this.selected.item = item;
        },
        getItemClass(item) {
            return {
                selected: (item == this.selected.item)
            }
        }
    },
    computed: {
        logger() {
            return Logger;
        },
        detailsItem() {
            return (this.selected.item || this.hovered.item);
        }
    }
}
</script>

<style scoped>
.item-details
{
    position: absolute;
    top: 0;
    left: 0;
    width: 30em;
    transform: translate(calc(-100% - 1em), 0);
    background: black;
}

.items
{
    max-height: 30em;
    overflow-x: hidden;
    overflow-y: auto;
}

table
{
    width: 100%;
}

td.id,
td.icon
{
    width: 1em;
}

td
{
    max-width: 4em;
    overflow: hidden;
    white-space: nowrap;
    padding: 0 0.5em;
}
</style>
