<template lang="pug">
div.data-something
  // div(v-text="visualizationComponent")
  component(:is="visualizationComponent", :value="value")
</template>

<script>
export default {
    name: "DataSomething",
    props: {
        value: {
            required: true
        }
    },
    mounted() {
    },
    methods: {
        kebabize(s) {
            s = s.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
            // remove '-' from the beginning of the string
            s = s.replace(/^-/, '');
            return s;
        }
    },
    computed: {
        visualizationComponent() {
            return this.kebabize((() => {
                // Check if the value is null.
                if ((!this.value) || (typeof (this.value) != 'object')) {
                    return 'DataPrimitive'
                }
                // Check if the value is an action stack item.
                if (this.value.redo) return 'ActionStackItem';
                if (this.value.redos) return 'ActionStackItem';
                // Check if the value is an action stack item.
                if (this.value.uid) return 'DatabaseItem';
                // Check if the value is a Vue reactive list wrapper.
                if (this.value.__ob__ && this.value.__ob__.dep.id && Array.isArray(this.value)) {
                    return 'DataList'
                }
                // Check if the value is a Vue reactive dictionary wrapper.
                if (this.value.__ob__ && this.value.__ob__.dep.id && typeof this.value === 'object') {
                    return 'DataDictionary'
                }
                // Check if the value is a JavaScript array.
                if (Array.isArray(this.value)) {
                    return 'DataList'
                }
                // Check if the value is a JavaScript object.
                if (typeof this.value === 'object') {
                    return 'DataDictionary'
                }
                // If none of the above conditions are met, the value must be a primitive.
                return 'DataPrimitive'
            })())
        }
    }
}
</script>

<style scoped>
div.data-something {
    max-height: 1.5em;
    overflow: hidden;
}
</style>
