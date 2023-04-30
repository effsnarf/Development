<template lang="pug">
div
    div(v-if="isEditable(path)")
        div.flex.w-100pc(v-if="(getValueType(value) != 'enum')")
            textarea.fs-m1(type="text", v-model="myValue")
            button(@click="$emit('value-input', myValue)") ✔️
        button(v-else, v-text="value", @click="onClick")
    div(v-if="(!isEditable(path))", v-text="value")
</template>

<script>
export default {
    props: {
        value: {
        },
        path: {
        }
    },
    data() {
        return {
            myValue: null
        }
    },
    methods: {
        onClick() {
            // horizontal / vertical
            let newValue = (this.value == 'horizontal') ? 'vertical' : 'horizontal';
            this.$emit('value-input', newValue);
        },
        getValueType(value) {
            if (typeof value == 'string') {
                if (value == 'horizontal' || value == 'vertical') return 'enum';
            }
            return (typeof value);
        },
        isEditable(path) {
            path = path.join('.');
            if (path.endsWith('_id')) return false;
            if (path == 'type') return false;
            return true;
        }
    },
    watch: {
        value: {
            handler(value) {
                this.myValue = value;
            },
            immediate: true,
        }
    },
}
</script>

