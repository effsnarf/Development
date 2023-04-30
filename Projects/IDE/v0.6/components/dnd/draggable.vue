<template lang="pug">
div(draggable='true', @dragstart='handleDragStart', @dragend='handleDragEnd', @dragover='handleDragOver')
  slot
</template>

<script>
export default {
    props: {
        dragItem: {
            type: Object,
            required: true,
        },
    },
    methods: {
        handleDragStart(event) {
            // Set the data that will be transferred during the drag and drop operation
            event.dataTransfer.setData('application/json', JSON.stringify(this.dragItem));
        },
        handleDragEnd(event) {
            // Do something when the drag and drop operation ends
        },
        handleDragOver(event) {
            // Prevent default behavior to allow the drop event to be triggered
            event.preventDefault();
        },
    },
};
</script>

<style scoped>
div {
    cursor: grab;
}
</style>