<!--
Layout transition component
Used to animate layout changes

Usage:

<layout-transition>
    <div>...</div>
</layout-transition>

snapshot() clones all the elements, overlays them on top, and hides the original elements
then the inner elements are moved around to their new positions by their component's code
async animate() animates the clones to their new positions, then removes the clones and shows the original elements in their new positions

Uses the LayoutTransitions class to calculate the new positions of the elements and animate them.
-->

<template lang="pug">
div.flex.justify-center(ref="container1", :style="getContainerStyle()")
  slot
</template>

<script>
import { LayoutTransitions } from '~/code/util/layout-transitions';

export default {
    props: {
        // The duration of the transition in milliseconds
        duration: {
            type: Number,
            default: 300,
        },
    },
    data() {
        return {
            layoutTransitions: new LayoutTransitions(),
            showOriginal: true,
            clones: {},
        };
    },
    methods: {
        getContainerStyle() {
            let style = {};
            style.transition = `0s`;
            // If the original elements are being hidden, set opacity to 0
            if (!this.showOriginal) {
                style.opacity = 0;
            }
            return style;
        },
        // Called before the transition
        snapshot() {
            // Clone all the elements
            this.clones = this.layoutTransitions.getCloneElements(this.$refs.container1, true);
            // Hide the original elements
            this.showOriginal = false;
        },
        // Animate
        async animate() {
            // Get target elements
            let elements2 = this.layoutTransitions.getCloneElements(this.$refs.container1, false);

            // Create a list of animations
            let animations = this.layoutTransitions.getAnimations(this.clones, elements2);

            // Remove all the target elements
            for (let element of Object.values(elements2)) {
                element.remove();
            }

            // Get a list of all animation promises
            let promises = animations.map((animation) => {
                // Animate the element
                return this.layoutTransitions.animateElement(animation, this.duration);
            });

            // Wait for all animations to finish
            await Promise.all(promises);

            // Remove all the cloned elements
            for (let element of Object.values(this.clones)) {
                element.remove();
            }
            // Show the original elements
            this.showOriginal = true;
        }
    }
}
</script>

<style scoped>
div
{
    position: relative;
}
</style>
