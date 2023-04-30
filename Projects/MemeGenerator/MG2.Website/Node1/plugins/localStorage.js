
var localStoragePlugin = {

  getItem: function(key) {
    return null;
  },
  setItem: function(key, value) {

  }
};

if (typeof(window) != `undefined`)
{
  window.$localStorage = localStoragePlugin;
}

export default ({ app }, inject) => {
  var plugin = (typeof(localStorage) != `undefined`) ?
  localStorage : localStoragePlugin;

  // Inject in Vue, context and store.
  inject("localStorage", plugin);
};
