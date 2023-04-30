<template lang="pug">
dnd-dropzone.trash-can(@dropzone-drop="onDropzoneDrop")
</template>

<script>
import { msg } from '~/code/util/msg';

export default {
    methods: {
        onDropzoneDrop(dragItem, dropItem) {
            this.$emit(`trashcan-drop`, dragItem, dropItem);
        }
    }
}
</script>

<style scoped>
.trash-can
{
    position: fixed;
    left: 1em;
    bottom: 1em;
    width: 10em;
    aspect-ratio: 0.85;
    background-image: url(~/img/trash-can.png);
    background-size: contain;
    transition: 0.2s;
}

.trash-can.dragover
{
    border: 2px solid gray;
    box-shadow: inset -4px 4px 2px black;
    transition: 0s;
}
</style>
