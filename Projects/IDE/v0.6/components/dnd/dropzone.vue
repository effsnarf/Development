<template lang="pug">
div(:class="getCssClass()", @dragover='handleDragOver', @dragenter='handleDragEnter', @dragleave='handleDragLeave', @drop='handleDrop')
  slot
</template>

<script>
import { msg } from '~/code/util/msg';

export default {
    props: {
        dropItem: {
            type: Object,
        },
    },
    data() {
        return {
            isDraggedOver: false,
        };
    },
    methods: {
        getCssClass() {
            return {
                dropzone: true,
                dragover: this.isDraggedOver,
            };
        },
        handleDragOver(event) {
            // Prevent default behavior to allow the drop event to be triggered
            event.preventDefault();
        },
        handleDragEnter(event) {
            this.isDraggedOver = true;
            this.$emit(`dropzone-dragenter`, event);
        },
        handleDragLeave(event) {
            this.isDraggedOver = false;
            this.$emit(`dropzone-dragleave`);
        },
        handleDrop(event) {
            event.preventDefault();
            event.stopPropagation();

            this.isDraggedOver = false;

            // Get the data that was transferred during the drag and drop operation
            const dragItem = JSON.parse(event.dataTransfer.getData('application/json'));

            this.$emit('dropzone-drop', dragItem, this.dropItem);
        },
    },
};
</script>

