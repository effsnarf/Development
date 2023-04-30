export { default as NuxtLogo } from '../..\\components\\NuxtLogo.vue'
export { default as SeeAlso } from '../..\\components\\SeeAlso.vue'
export { default as Thread } from '../..\\components\\Thread.vue'
export { default as Thread2 } from '../..\\components\\Thread2.vue'
export { default as Thread3 } from '../..\\components\\Thread3.vue'
export { default as ThreadTeaser } from '../..\\components\\ThreadTeaser.vue'
export { default as ThreadTeasers } from '../..\\components\\ThreadTeasers.vue'
export { default as Tutorial } from '../..\\components\\Tutorial.vue'

// nuxt/nuxt.js#8607
function wrapFunctional(options) {
  if (!options || !options.functional) {
    return options
  }

  const propKeys = Array.isArray(options.props) ? options.props : Object.keys(options.props || {})

  return {
    render(h) {
      const attrs = {}
      const props = {}

      for (const key in this.$attrs) {
        if (propKeys.includes(key)) {
          props[key] = this.$attrs[key]
        } else {
          attrs[key] = this.$attrs[key]
        }
      }

      return h(options, {
        on: this.$listeners,
        attrs,
        props,
        scopedSlots: this.$scopedSlots,
      }, this.$slots.default)
    }
  }
}
