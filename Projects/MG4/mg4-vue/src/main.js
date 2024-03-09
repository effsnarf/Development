import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

String.prototype.toTitleCase = function() {
  return this.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

Array.prototype.distinct = function() {
  return this.filter((value, index, self) => self.indexOf(value) === index);
}

new Vue({
  render: h => h(App),
}).$mount('#app')
