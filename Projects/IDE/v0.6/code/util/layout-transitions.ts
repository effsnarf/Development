// LayoutTransition class
//
// Animates from one layout to another by transitioning and crossfading all the child elements mapped by their node id.
// All child elements that have a data-node-id attribute will be animated.
// The rest of the elements will crossfade.

import { msg } from "./msg";

class LayoutTransitions {

    async animate(layout1: HTMLElement, layout2: HTMLElement, duration: number = 600) {
        // Get all the elements with a data-node-id attribute into a dictionary
        let elements1 = this.getCloneElements(layout1);
        // Get layout2 elements
        let elements2 = this.getCloneElements(layout2);

        // Create a list of animations
        let animations = this.getAnimations(elements1, elements2);

        // Get a list of all animation promises
        let promises = animations.map((animation: any) => {
            // Animate the element
            return this.animateElement(animation, duration);
        });

        // Wait for all animations to finish
        await Promise.all(promises);

        // Remove all the cloned elements
        for (let element of Object.values(elements1)) {
            (element as any).remove();
        }
        for (let element of Object.values(elements2)) {
            (element as any).remove();
        }
    }

    animateElement(animation: any, duration: number) {
        // Create a promise
        return new Promise((resolve, reject) => {
            // Show the element
            animation.element.style.visibility = "visible";
            let cssKeyframes = animation.keyframes.map((k: any) => this.toCssKeyframe(k));

            // Animate the element with the keyframes
            let domAnimation = animation.element.animate(cssKeyframes, {
                duration: duration,
                easing: "ease-in-out",
                fill: "forwards",
            });

            // Biztos ami biztos
            setTimeout(resolve, duration);

            domAnimation.onfinish = () => {
                // Resolve the promise
                resolve(null);
            }
        });
    }

    toCssKeyframe(keyframe: any) {
        // Convert a keyframe to a CSS keyframe
        // Transform origin is set to the top left corner
        let cssKeyframe = {
            opacity: keyframe.opacity,
            transform: `translate(${keyframe.position.x}px, ${keyframe.position.y}px) scale(${keyframe.size.width}, ${keyframe.size.height})`,
            transformOrigin: "0 0"
        }
        return cssKeyframe;
    }

    // Returns a list of animations from layout1 to layout2 (only one way)
    //
    // An animation is an object with the following properties:
    // - element: the element to animate
    // - keyframes: an array of keyframes (2 in this case, start and end)
    //
    // Properties that are keyframed are:
    // - position
    // - size
    // - opacity
    getAnimations(elements1: any, elements2: any) {
        // Create a list of animations
        let animations = [];
        // Iterate over all the elements in layout1
        for (let id in elements1) {
            // Get the element
            let element1 = elements1[id];
            // Get the element in layout2
            let element2 = elements2[id];
            // Get the animation
            let animation = this.getAnimation(element1, element2);
            // Add it to the list
            animations.push(animation);
        }
        // Return the list of animations
        return animations;
    }

    // Returns an animation from layout1 to layout2 (only one way)
    // If (element2 == null) then the animation will be a fade out
    getAnimation(element1: HTMLElement, element2: HTMLElement) {
        // Create the animation object
        let animation: any = {
            element: element1
        };
        // Get the keyframes
        let keyframes = this.getKeyframes(element1, element2);
        // Add the keyframes to the animation
        animation.keyframes = keyframes;
        // Return the animation
        return animation;
    }

    // Returns the keyframes for an animation
    // If (element2 == null) then the animation will be a fade out
    getKeyframes(element1: HTMLElement, element2: HTMLElement) {
        // Create the keyframes array
        let keyframes = [];
        // Get the start keyframe
        let start = this.getKeyframe(element1, element1);
        // Add it to the keyframes array
        keyframes.push(start);
        // Get the end keyframe
        let end = this.getKeyframe(element1, element2);
        // Add it to the keyframes array
        keyframes.push(end);
        // Return the keyframes array
        return keyframes;
    }

    // Returns a keyframe for an animation
    // If (element2 == null) then the animation will be a fade out
    getKeyframe(element1: HTMLElement, element2: HTMLElement) {
        // Create the keyframe object
        let keyframe: any = {};
        // Get the position
        let position = this.getPositionDiff(element1, element2);
        // Add it to the keyframe
        keyframe.position = position;
        // Get the size
        let size = this.getSizeDiff(element1, element2);
        // Add it to the keyframe
        keyframe.size = size;
        // Get the opacity
        let opacity = (element2 == null) ? 0 : 1;
        // Add it to the keyframe
        keyframe.opacity = opacity;
        // Return the keyframe
        return keyframe;
    }

    // Returns the fixed position diff between two elements
    getPositionDiff(element1: HTMLElement, element2: HTMLElement) {
        // If (element2 == null) then the position doesn't move
        if (element2 == null) {
            return { x: 0, y: 0 };
        }
        // Get the position of element1
        let rect1 = element1.getBoundingClientRect();
        // Get the position of element2
        let rect2 = element2.getBoundingClientRect();
        // Calculate the position
        let position = {
            x: rect2.left - rect1.left,
            y: rect2.top - rect1.top
        };
        // Return the position
        return position;
    }

    // Returns the size diff between two elements
    getSizeDiff(element1: HTMLElement, element2: HTMLElement) {
        // If (element2 == null) then the size doesn't change
        if (element2 == null) {
            return { width: 1, height: 1 };
        }
        // Get the size of element1
        let rect1 = element1.getBoundingClientRect();
        // Get the size of element2
        let rect2 = element2.getBoundingClientRect();
        // Calculate the size
        let size = {
            width: rect2.width / rect1.width,
            height: rect2.height / rect1.height
        };
        // Return the size
        return size;
    }

    // Clone absolutely positioned ghost elements for the animation
    // This is because nested elements affect each other's position
    // For each element, create a clone and position it absolutely
    // With the same position and size as the original element
    getCloneElements(layout: HTMLElement) {
        // Create a dictionary of elements
        let elements: any = {};
        // Get all the elements with a data-node-id attribute
        let elementsWithId = layout.querySelectorAll('[data-node-id]');
        // Iterate over all the elements
        for (let i = 0; i < elementsWithId.length; i++) {
            // Get the element
            let element = elementsWithId[i];
            // Get the node id
            let id = (element.getAttribute('data-node-id') as string);
            // Create a clone of the element
            let clone = element.cloneNode(true) as HTMLElement;
            // Remove all descendants with a data-node-id attribute
            let descendantsWithId = clone.querySelectorAll('[data-node-id]');
            for (let j = 0; j < descendantsWithId.length; j++) {
                let descendant = descendantsWithId[j];
                descendant.parentNode?.removeChild(descendant);
            }
            // Set the position to absolute
            clone.style.position = 'absolute';
            // Get the position of the element
            let rect = element.getBoundingClientRect();
            // Set the position of the clone
            clone.style.left = rect.left + 'px';
            clone.style.top = rect.top + 'px';
            // Set the size of the clone
            clone.style.width = rect.width + 'px';
            clone.style.height = rect.height + 'px';
            // Add the clone to the layout
            document.body.appendChild(clone);
            // Add the clone to the dictionary
            elements[id] = clone;
        }
        // Return the dictionary
        return elements;
    }

}


export { LayoutTransitions };
